import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { products } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { CreateProductSchema } from "@/lib/validations/inventory";
import { eq, and, like, or, lt } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token tidak valid" },
        { status: 401 }
      );
    }

    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id");
    const lowStock = searchParams.get("low_stock") === "true";
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(products.nama, `%${search}%`),
          like(products.kodeProduk, `%${search}%`)
        )
      );
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (lowStock) {
      conditions.push(lt(products.stok, products.stokMinimum));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.products.findMany({
      where,
      with: {
        category: {
          columns: { id: true, nama: true },
        },
      },
      limit,
      offset,
      orderBy: (products, { asc }) => [asc(products.nama)],
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Token tidak valid" },
        { status: 401 }
      );
    }

    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    // Check kode_produk uniqueness
    const existing = await db.query.products.findFirst({
      where: eq(products.kodeProduk, parsed.data.kode_produk),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Kode produk sudah digunakan" },
        { status: 409 }
      );
    }

    const [product] = await db
      .insert(products)
      .values({
        kodeProduk: parsed.data.kode_produk,
        categoryId: parsed.data.category_id,
        nama: parsed.data.nama,
        deskripsi: parsed.data.deskripsi,
        hargaBeli: parsed.data.harga_beli.toString(),
        hargaJual: parsed.data.harga_jual.toString(),
        stok: parsed.data.stok,
        stokMinimum: parsed.data.stok_minimum,
        satuan: parsed.data.satuan,
      })
      .returning();

    return NextResponse.json(
      { data: product, message: "Produk berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}