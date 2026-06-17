import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { categories } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

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
    const tipe = searchParams.get("tipe");

    const result = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.nama)],
    });

    const filtered = tipe ? result.filter((c) => c.tipe === tipe) : result;

    return NextResponse.json({ data: filtered });
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
    const [category] = await db
      .insert(categories)
      .values({ nama: body.nama, tipe: body.tipe })
      .returning();

    return NextResponse.json(
      { data: category, message: "Kategori berhasil ditambahkan" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}