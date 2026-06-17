import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
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

    const service = await db.query.services.findFirst({
      where: eq(services.id, params.id),
      with: { category: { columns: { id: true, nama: true } } },
    });
    if (!service) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: service });
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

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.nama !== undefined) updateData.nama = body.nama;
    if (body.deskripsi !== undefined) updateData.deskripsi = body.deskripsi;
    if (body.harga !== undefined) updateData.harga = body.harga.toString();
    if (body.durasi_menit !== undefined) updateData.durasiMenit = body.durasi_menit;
    if (body.dokter_required !== undefined) updateData.dokterRequired = body.dokter_required;
    if (body.is_active !== undefined) updateData.isActive = body.is_active;
    if (body.category_id !== undefined) updateData.categoryId = body.category_id;

    const [updated] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: updated, message: "Layanan berhasil diperbarui" });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}