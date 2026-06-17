import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { medicalRecords } from "@/db/schema";
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

    const record = await db.query.medicalRecords.findFirst({
      where: eq(medicalRecords.id, params.id),
      with: {
        pet: {
          columns: {
            id: true,
            nama: true,
            spesies: true,
            ownerId: true,
          },
        },
        dokter: {
          columns: {
            id: true,
            namaLengkap: true,
          },
        },
        appointment: {
          columns: {
            id: true,
            tglJanji: true,
            jenis: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Rekam medis tidak ditemukan" },
        { status: 404 }
      );
    }

    // Customer can only view their own pets' visible records
    if (payload.role === "customer") {
      if (record.pet.ownerId !== payload.sub || !record.isVisibleCustomer) {
        return NextResponse.json(
          { error: "Tidak memiliki akses" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}