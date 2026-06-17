import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { transactions, products, stockMutations } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { eq, sql } from "drizzle-orm";

export async function GET(
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

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, params.id),
      with: {
        kasir: {
          columns: { id: true, namaLengkap: true },
        },
        customer: {
          columns: { id: true, namaLengkap: true },
        },
        items: {
          with: {
            product: {
              columns: { id: true, kodeProduk: true, nama: true },
            },
            service: {
              columns: { id: true, nama: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Customer can only view their own transactions
    if (
      payload.role === "customer" &&
      transaction.customerId !== payload.sub
    ) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: transaction });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Only owner can cancel transactions
    if (payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Sensitive endpoint — re-check is_active
    await assertActiveUser(payload.sub);

    const body = await request.json();

    // Only allow status change to 'batal'
    if (body.status !== "batal") {
      return NextResponse.json(
        { error: "Hanya pembatalan yang diizinkan" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const existing = await tx.query.transactions.findFirst({
        where: eq(transactions.id, params.id),
        with: { items: true },
      });

      if (!existing) {
        throw new Error("NOT_FOUND");
      }

      if (existing.status === "batal") {
        throw new Error("ALREADY_CANCELLED");
      }

      // Restore stock for each product item
      for (const item of existing.items) {
        if (item.tipeItem === "produk" && item.productId) {
          const [locked] = await tx.execute(
            sql`SELECT stok FROM products WHERE id = ${item.productId}::uuid FOR UPDATE`
          );

          const currentStok = Number((locked as { stok: number }).stok);
          const newStok = currentStok + item.qty;

          await tx
            .update(products)
            .set({ stok: newStok })
            .where(eq(products.id, item.productId));

          await tx.insert(stockMutations).values({
            productId: item.productId,
            tipe: "masuk",
            qtySebelum: currentStok,
            qtyPerubahan: item.qty,
            qtySesudah: newStok,
            referensi: `BATAL-${existing.noTransaksi}`,
            catatan: "Pembatalan transaksi",
            staffId: payload.sub,
          });
        }
      }

      const [updated] = await tx
        .update(transactions)
        .set({ status: "batal" })
        .where(eq(transactions.id, params.id))
        .returning();

      return updated;
    });

    return NextResponse.json({
      data: result,
      message: "Transaksi berhasil dibatalkan",
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
          { error: "Transaksi tidak ditemukan" },
          { status: 404 }
        );
      }
      if (error.message === "ALREADY_CANCELLED") {
        return NextResponse.json(
          { error: "Transaksi sudah dibatalkan" },
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