import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { products, services } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq, and, like, or } from "drizzle-orm";

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

    // Only staff and owner can access POS
    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const productConditions = [eq(products.isActive, true)];
    if (search) {
      productConditions.push(
        or(
          like(products.nama, `%${search}%`),
          like(products.kodeProduk, `%${search}%`)
        )
      );
    }

    const serviceConditions = [eq(services.isActive, true)];
    if (search) {
      serviceConditions.push(like(services.nama, `%${search}%`));
    }

    const [productList, serviceList] = await Promise.all([
      db.query.products.findMany({
        where: and(...productConditions),
        with: {
          category: {
            columns: { id: true, nama: true },
          },
        },
        orderBy: (products, { asc }) => [asc(products.nama)],
      }),
      db.query.services.findMany({
        where: and(...serviceConditions),
        with: {
          category: {
            columns: { id: true, nama: true },
          },
        },
        orderBy: (services, { asc }) => [asc(services.nama)],
      }),
    ]);

    return NextResponse.json({
      data: {
        products: productList,
        services: serviceList,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}