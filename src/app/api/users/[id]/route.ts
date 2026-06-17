import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { UpdateUserSchema } from "@/lib/validations/user";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only owner can view user details, or user viewing themselves
    if (payload.role !== "owner" && payload.sub !== params.id) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const user = await db.query.profiles.findFirst({
      where: eq(profiles.id, params.id),
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
        updatedAt: true,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Only owner can update users (sensitive endpoint)
    if (payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Re-check is_active from DB (sensitive endpoint)
    await assertActiveUser(payload.sub);

    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(profiles)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, params.id))
      .returning({
        id: profiles.id,
        email: profiles.email,
        role: profiles.role,
        namaLengkap: profiles.namaLengkap,
        isActive: profiles.isActive,
      });

    if (!updated) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updated,
      message: "User berhasil diperbarui",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_INACTIVE") {
      return NextResponse.json(
        { error: "Akun tidak aktif" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}