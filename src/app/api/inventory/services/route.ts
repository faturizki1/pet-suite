import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { services } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq, like, and } from "drizzle-orm";

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
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id");

    const conditions = [];
    if (search) conditions.push(like(services.nama, `%${search}%`));
    if (categoryId) conditions.push(eq(services.categoryId, categoryId));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.services.findMany({
      where,
      with: { category: { columns: { id: true, nama: true } } },
      orderBy: (services, { asc }) => [asc(services.nama)],
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

    const body = await request.json();
    const [service] = await db
      .insert(services)
      .values({
        categoryId: body.category_id,
        nama: body.nama,
        deskripsi: body.deskripsi,
        harga: body.harga.toString(),
        durasiMenit: body.durasi_menit,
        dokterRequired: body.dokter_required ?? false,
      })
      .returning();

    return NextResponse.json(
      { data: service, message: "Layanan berhasil ditambahkan" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}