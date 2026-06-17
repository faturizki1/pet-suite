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

    const conditions = [eq(transactions.status, "lunas")];
    if (tglDari) conditions.push(gte(transactions.tglTransaksi, new Date(tglDari)));
    if (tglSampai) conditions.push(lte(transactions.tglTransaksi, new Date(tglSampai)));

    const result = await db.query.transactions.findMany({
      where: and(...conditions),
      columns: { metodeBayar: true, total: true },
    });

    const grouped: Record<string, number> = {};
    for (const t of result) {
      const method = t.metodeBayar || "lainnya";
      grouped[method] = (grouped[method] || 0) + Number(t.total);
    }

    const data = Object.entries(grouped).map(([method, total]) => ({ method, total }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}