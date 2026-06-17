import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { RegisterSchema } from "@/lib/validations/auth";
import { hashPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const { email, password, role, nama_lengkap, no_hp, alamat } = parsed.data;

    // Check if email already exists
    const existing = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(profiles)
      .values({
        email,
        passwordHash,
        role,
        namaLengkap: nama_lengkap,
        noHp: no_hp,
        alamat,
      })
      .returning();

    return NextResponse.json(
      {
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          nama_lengkap: user.namaLengkap,
        },
        message: "Registrasi berhasil",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}