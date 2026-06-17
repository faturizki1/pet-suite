import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
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
    if (payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tglDari = searchParams.get("tgl_dari");
    const tglSampai = searchParams.get("tgl_sampai");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [eq(transactions.status, "lunas")];
    if (tglDari) conditions.push(gte(transactions.tglTransaksi, new Date(tglDari)));
    if (tglSampai) conditions.push(lte(transactions.tglTransaksi, new Date(tglSampai)));

    const result = await db.query.transactions.findMany({
      where: and(...conditions),
      with: {
        kasir: { columns: { id: true, namaLengkap: true } },
        customer: { columns: { id: true, namaLengkap: true } },
      },
      limit,
      offset,
      orderBy: (t, { desc }) => [desc(t.tglTransaksi)],
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}