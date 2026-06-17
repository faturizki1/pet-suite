import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { pets } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { CreatePetSchema } from "@/lib/validations/pet";
import { eq, and } from "drizzle-orm";

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

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("owner_id");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    // Customer only sees their own pets
    // Owner, dokter, staff can see all
    const conditions = [];
    if (payload.role === "customer") {
      conditions.push(eq(pets.ownerId, payload.sub));
    } else if (ownerId) {
      conditions.push(eq(pets.ownerId, ownerId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.pets.findMany({
      where,
      with: {
        owner: {
          columns: {
            id: true,
            namaLengkap: true,
            email: true,
            noHp: true,
          },
        },
      },
      limit,
      offset,
      orderBy: (pets, { desc }) => [desc(pets.createdAt)],
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

    const body = await request.json();
    const parsed = CreatePetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    // Customer can only create pets for themselves
    if (payload.role === "customer" && parsed.data.owner_id !== payload.sub) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const [pet] = await db
      .insert(pets)
      .values({
        ownerId: parsed.data.owner_id,
        nama: parsed.data.nama,
        spesies: parsed.data.spesies,
        ras: parsed.data.ras,
        jenisKelamin: parsed.data.jenis_kelamin,
        tglLahir: parsed.data.tgl_lahir,
        beratKg: parsed.data.berat_kg?.toString(),
      })
      .returning();

    return NextResponse.json(
      { data: pet, message: "Hewan berhasil ditambahkan" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}