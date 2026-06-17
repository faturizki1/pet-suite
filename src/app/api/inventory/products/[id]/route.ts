import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }
    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    const product = await db.query.products.findFirst({
      where: eq(products.id, params.id),
      with: { category: { columns: { id: true, nama: true } } },
    });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: product });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }
    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }
    await assertActiveUser(payload.sub);

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.deskripsi !== undefined) updateData.deskripsi = body.deskripsi;
    if (body.harga_beli !== undefined) updateData.hargaBeli = body.harga_beli.toString();
    if (body.harga_jual !== undefined) updateData.hargaJual = body.harga_jual.toString();
    if (body.stok_minimum !== undefined) updateData.stokMinimum = body.stok_minimum;
    if (body.satuan !== undefined) updateData.satuan = body.satuan;
    if (body.category_id !== undefined) updateData.categoryId = body.category_id;
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    if (body.foto !== undefined) updateData.foto = body.foto;

    const [updated] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: updated, message: "Produk berhasil diperbarui" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_INACTIVE") {
      return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}