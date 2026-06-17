import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { bookingSlots } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

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
    if (payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.kuota !== undefined) updateData.kuota = body.kuota;
    if (body.is_available !== undefined) updateData.isAvailable = body.is_available;
    if (body.dokter_id !== undefined) updateData.dokterId = body.dokter_id;

    const [updated] = await db
      .update(bookingSlots)
      .set(updateData)
      .where(eq(bookingSlots.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Slot tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: updated, message: "Slot berhasil diperbarui" });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(
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
    if (payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    await db.delete(bookingSlots).where(eq(bookingSlots.id, params.id));
    return NextResponse.json({ data: null, message: "Slot berhasil dihapus" });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}