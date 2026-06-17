import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

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

    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, payload.sub),
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}