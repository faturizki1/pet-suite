import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { LoginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  SESSION_COOKIE,
  COOKIE_OPTIONS,
} from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Akun tidak aktif" },
        { status: 403 }
      );
    }

    const token = await createSessionToken({
      sub: user.id,
      role: user.role as "owner" | "dokter" | "staff" | "customer",
      is_active: user.isActive,
    });

    const response = NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        nama_lengkap: user.namaLengkap,
      },
      message: "Login berhasil",
    });

    response.cookies.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}