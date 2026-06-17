import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";

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
    // Only owner can delete expenses
    if (payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    // Sensitive endpoint
    await assertActiveUser(payload.sub);

    const existing = await db.query.expenses.findFirst({
      where: eq(expenses.id, params.id),
    });
    if (!existing) {
      return NextResponse.json({ error: "Pengeluaran tidak ditemukan" }, { status: 404 });
    }

    // Hard delete — expenses is the only table allowed hard delete
    await db.delete(expenses).where(eq(expenses.id, params.id));

    return NextResponse.json({ data: null, message: "Pengeluaran berhasil dihapus" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_INACTIVE") {
      return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}