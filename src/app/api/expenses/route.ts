import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { expenses } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { CreateExpenseSchema } from "@/lib/validations/expense";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const tglDari = searchParams.get("tgl_dari");
    const tglSampai = searchParams.get("tgl_sampai");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];
    if (tglDari) conditions.push(gte(expenses.tglPengeluaran, tglDari));
    if (tglSampai) conditions.push(lte(expenses.tglPengeluaran, tglSampai));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.expenses.findMany({
      where,
      with: { staff: { columns: { id: true, namaLengkap: true } } },
      limit,
      offset,
      orderBy: (e, { desc }) => [desc(e.tglPengeluaran)],
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Sensitive endpoint
    await assertActiveUser(payload.sub);

    const body = await request.json();
    const parsed = CreateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const [expense] = await db
      .insert(expenses)
      .values({
        kategori: parsed.data.kategori,
        deskripsi: parsed.data.deskripsi,
        jumlah: parsed.data.jumlah.toString(),
        tglPengeluaran: parsed.data.tgl_pengeluaran,
        staffId: payload.sub,
      })
      .returning();

    return NextResponse.json(
      { data: expense, message: "Pengeluaran berhasil dicatat" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_INACTIVE") {
      return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}