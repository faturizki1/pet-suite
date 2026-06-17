import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { inpatients } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { CreateInpatientSchema } from "@/lib/validations/inpatient";
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
    const status = searchParams.get("status");
    const dokterId = searchParams.get("dokter_id");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];

    if (status) {
      conditions.push(eq(inpatients.status, status));
    }

    if (dokterId) {
      conditions.push(eq(inpatients.dokterId, dokterId));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.inpatients.findMany({
      where,
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
      },
      limit,
      offset,
      orderBy: (inpatients, { desc }) => [desc(inpatients.tglMasuk)],
    });

    // Customer only sees their own pets' inpatients
    const filtered =
      payload.role === "customer"
        ? result.filter((r) => r.pet.ownerId === payload.sub)
        : result;

    return NextResponse.json({ data: filtered });
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

    // Only dokter and owner can admit inpatients
    if (payload.role !== "dokter" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Sensitive endpoint — re-check is_active
    await assertActiveUser(payload.sub);

    const body = await request.json();
    const parsed = CreateInpatientSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const [inpatient] = await db
      .insert(inpatients)
      .values({
        petId: parsed.data.pet_id,
        dokterId: parsed.data.dokter_id,
        noKandang: parsed.data.no_kandang,
        diagnosisAwal: parsed.data.diagnosis_awal,
        tindakanAwal: parsed.data.tindakan_awal,
      })
      .returning();

    return NextResponse.json(
      { data: inpatient, message: "Pasien rawat inap berhasil diadmisi" },
      { status: 201 }
    );
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