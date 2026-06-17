import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
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
    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    const body = await request.json();
    const [updated] = await db
      .update(categories)
      .set({ nama: body.nama, tipe: body.tipe })
      .where(eq(categories.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: updated, message: "Kategori berhasil diperbarui" });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}