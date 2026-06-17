import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { products, stockMutations } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { StockMutationSchema } from "@/lib/validations/inventory";
import { eq, sql } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token tidak valid" },
        { status: 401 }
      );
    }

    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Sensitive endpoint — re-check is_active
    await assertActiveUser(payload.sub);

    const body = await request.json();
    const parsed = StockMutationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      // Row lock
      const [locked] = await tx.execute(
        sql`SELECT stok FROM products WHERE id = ${params.id}::uuid FOR UPDATE`
      );

      if (!locked) {
        throw new Error("NOT_FOUND");
      }

      const currentStok = Number((locked as { stok: number }).stok);
      const { tipe, qty, catatan } = parsed.data;

      let newStok: number;
      let qtyPerubahan: number;

      if (tipe === "masuk") {
        newStok = currentStok + qty;
        qtyPerubahan = qty;
      } else {
        // adjustment
        newStok = qty; // qty here is the target stock
        qtyPerubahan = newStok - currentStok;
      }

      if (newStok < 0) {
        throw new Error("STOCK_NEGATIVE");
      }

      await tx
        .update(products)
        .set({ stok: newStok })
        .where(eq(products.id, params.id));

      const [mutation] = await tx
        .insert(stockMutations)
        .values({
          productId: params.id,
          tipe,
          qtySebelum: currentStok,
          qtyPerubahan,
          qtySesudah: newStok,
          referensi: "Manual",
          catatan: catatan || null,
          staffId: payload.sub,
        })
        .returning();

      return { product: { id: params.id, stok: newStok }, mutation };
    });

    return NextResponse.json({
      data: result,
      message: "Stok berhasil diperbarui",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED_INACTIVE") {
        return NextResponse.json(
          { error: "Akun tidak aktif" },
          { status: 403 }
        );
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json(
          { error: "Produk tidak ditemukan" },
          { status: 404 }
        );
      }
      if (error.message === "STOCK_NEGATIVE") {
        return NextResponse.json(
          { error: "Stok tidak boleh negatif" },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}