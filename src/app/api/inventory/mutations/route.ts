import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { stockMutations } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

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
    const productId = searchParams.get("product_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];
    if (productId) conditions.push(eq(stockMutations.productId, productId));

    const result = await db.query.stockMutations.findMany({
      with: {
        product: { columns: { id: true, nama: true, kodeProduk: true } },
        staff: { columns: { id: true, namaLengkap: true } },
      },
      limit,
      offset,
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}