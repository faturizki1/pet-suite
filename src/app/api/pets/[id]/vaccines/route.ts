import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { petVaccines, pets } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
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

    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, params.id),
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Hewan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (payload.role === "customer" && pet.ownerId !== payload.sub) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const vaccines = await db.query.petVaccines.findMany({
      where: eq(petVaccines.petId, params.id),
      with: {
        dokter: {
          columns: {
            id: true,
            namaLengkap: true,
          },
        },
      },
      orderBy: (v, { desc }) => [desc(v.tglVaksin)],
    });

    return NextResponse.json({ data: vaccines });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(
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

    // Only dokter and owner can add vaccines
    if (payload.role !== "dokter" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const pet = await db.query.pets.findFirst({
      where: eq(pets.id, params.id),
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Hewan tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const [vaccine] = await db
      .insert(petVaccines)
      .values({
        petId: params.id,
        namaVaksin: body.nama_vaksin,
        tglVaksin: body.tgl_vaksin,
        tglBerikutnya: body.tgl_berikutnya,
        dokterId: body.dokter_id || payload.sub,
        keterangan: body.keterangan,
      })
      .returning();

    return NextResponse.json(
      { data: vaccine, message: "Vaksin berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}