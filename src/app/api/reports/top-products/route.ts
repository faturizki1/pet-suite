import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { transactionItems, transactions } from "@/db/schema";
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

    const txConditions = [eq(transactions.status, "lunas")];
    if (tglDari) txConditions.push(gte(transactions.tglTransaksi, new Date(tglDari)));
    if (tglSampai) txConditions.push(lte(transactions.tglTransaksi, new Date(tglSampai)));

    const txList = await db.query.transactions.findMany({
      where: and(...txConditions),
      columns: { id: true },
    });

    const txIds = txList.map((t) => t.id);

    if (txIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const items = await db.query.transactionItems.findMany({
      where: eq(transactionItems.tipeItem, "produk"),
      columns: { namaItem: true, qty: true, subtotal: true, transactionId: true },
    });

    const filtered = items.filter((i) => txIds.includes(i.transactionId));

    // Aggregate by product name
    const grouped: Record<string, { qty: number; total: number }> = {};
    for (const item of filtered) {
      if (!grouped[item.namaItem]) {
        grouped[item.namaItem] = { qty: 0, total: 0 };
      }
      grouped[item.namaItem].qty += item.qty;
      grouped[item.namaItem].total += Number(item.subtotal);
    }

    const data = Object.entries(grouped)
      .map(([name, stats]) => ({ nama: name, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}