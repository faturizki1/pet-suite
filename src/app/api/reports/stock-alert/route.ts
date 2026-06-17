import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { lt } from "drizzle-orm";

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

    const result = await db.query.products.findMany({
      where: lt(products.stok, products.stokMinimum),
      columns: {
        id: true,
        kodeProduk: true,
        nama: true,
        stok: true,
        stokMinimum: true,
        satuan: true,
      },
      orderBy: (p, { asc }) => [asc(p.stok)],
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}