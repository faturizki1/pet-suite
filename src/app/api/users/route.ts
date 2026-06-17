import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq, like, or, and } from "drizzle-orm";

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

    // Only owner can list all users
    if (payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(profiles.namaLengkap, `%${search}%`),
          like(profiles.email, `%${search}%`)
        )
      );
    }

    if (role) {
      conditions.push(eq(profiles.role, role));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const users = await db.query.profiles.findMany({
      where,
      columns: {
        id: true,
        email: true,
        role: true,
        namaLengkap: true,
        noHp: true,
        alamat: true,
        fotoProfil: true,
        isActive: true,
        createdAt: true,
      },
      limit,
      offset,
      orderBy: (profiles, { desc }) => [desc(profiles.createdAt)],
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}