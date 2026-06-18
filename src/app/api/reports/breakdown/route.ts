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
      return NextResponse.json({ data: { produk: 0, layanan: 0 } });
    }

    const items = await db.query.transactionItems.findMany({
      columns: { tipeItem: true, subtotal: true, transactionId: true },
    });

    const filtered = items.filter((i) => txIds.includes(i.transactionId));

    const produk = filtered
      .filter((i) => i.tipeItem === "produk")
      .reduce((sum, i) => sum + Number(i.subtotal), 0);
    const layanan = filtered
      .filter((i) => i.tipeItem === "layanan")
      .reduce((sum, i) => sum + Number(i.subtotal), 0);

    return NextResponse.json({ data: { produk, layanan } });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}