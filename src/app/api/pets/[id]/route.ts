import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { pets } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq, and } from "drizzle-orm";

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

    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, params.id),
      with: {
        owner: {
          columns: {
            id: true,
            namaLengkap: true,
            email: true,
            noHp: true,
          },
        },
        vaccines: {
          with: {
            dokter: {
              columns: {
                id: true,
                namaLengkap: true,
              },
            },
          },
          orderBy: (vaccines, { desc }) => [desc(vaccines.tglVaksin)],
        },
      },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Hewan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Customer can only view their own pets
    if (payload.role === "customer" && pet.ownerId !== payload.sub) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: pet });
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

    const existing = await db.query.pets.findFirst({
      where: eq(pets.id, params.id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Hewan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Customer can only update their own pets
    if (payload.role === "customer" && existing.ownerId !== payload.sub) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const [updated] = await db
      .update(pets)
      .set({
        nama: body.nama,
        spesies: body.spesies,
        ras: body.ras,
        jenisKelamin: body.jenis_kelamin,
        tglLahir: body.tgl_lahir,
        beratKg: body.berat_kg?.toString(),
        warna: body.warna,
        ciriKhas: body.ciri_khas,
        foto: body.foto,
        status: body.status,
      })
      .where(eq(pets.id, params.id))
      .returning();

    return NextResponse.json({
      data: updated,
      message: "Data hewan berhasil diperbarui",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}