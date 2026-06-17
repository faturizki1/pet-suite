import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { transactions, expenses } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq, and, gte, lte, sql } from "drizzle-orm";

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
    const expConditions = [];

    if (tglDari) {
      txConditions.push(gte(transactions.tglTransaksi, new Date(tglDari)));
      expConditions.push(gte(expenses.tglPengeluaran, tglDari));
    }
    if (tglSampai) {
      txConditions.push(lte(transactions.tglTransaksi, new Date(tglSampai)));
      expConditions.push(lte(expenses.tglPengeluaran, tglSampai));
    }

    const txList = await db.query.transactions.findMany({
      where: and(...txConditions),
      columns: { total: true },
    });

    const expList = await db.query.expenses.findMany({
      columns: { jumlah: true },
    });

    const totalPemasukan = txList.reduce((sum, t) => sum + Number(t.total), 0);
    const totalPengeluaran = expList.reduce((sum, e) => sum + Number(e.jumlah), 0);
    const labaBersih = totalPemasukan - totalPengeluaran;

    return NextResponse.json({
      data: {
        total_pemasukan: totalPemasukan,
        total_pengeluaran: totalPengeluaran,
        laba_bersih: labaBersih,
        total_transaksi: txList.length,
      },
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}