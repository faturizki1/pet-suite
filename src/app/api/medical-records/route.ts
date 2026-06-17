import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { medicalRecords } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { CreateMedicalRecordSchema } from "@/lib/validations/medical-record";
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
    const petId = searchParams.get("pet_id");
    const dokterId = searchParams.get("dokter_id");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];

    if (petId) {
      conditions.push(eq(medicalRecords.petId, petId));
    }

    if (dokterId) {
      conditions.push(eq(medicalRecords.dokterId, dokterId));
    }

    // Customer only sees visible records for their own pets
    if (payload.role === "customer") {
      conditions.push(eq(medicalRecords.isVisibleCustomer, true));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.medicalRecords.findMany({
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
      orderBy: (records, { desc }) => [desc(records.tanggal)],
    });

    // Filter by owner for customer role
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

    // Only dokter and owner can create medical records
    if (payload.role !== "dokter" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Sensitive endpoint — re-check is_active
    await assertActiveUser(payload.sub);

    const body = await request.json();
    const parsed = CreateMedicalRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const [record] = await db
      .insert(medicalRecords)
      .values({
        petId: parsed.data.pet_id,
        dokterId: parsed.data.dokter_id,
        appointmentId: parsed.data.appointment_id,
        beratSaatPeriksa: parsed.data.berat_saat_periksa?.toString(),
        suhu: parsed.data.suhu?.toString(),
        keluhan: parsed.data.keluhan,
        diagnosis: parsed.data.diagnosis,
        tindakan: parsed.data.tindakan,
        resep: parsed.data.resep,
        catatanFollowup: parsed.data.catatan_followup,
        isVisibleCustomer: parsed.data.is_visible_customer,
      })
      .returning();

    return NextResponse.json(
      { data: record, message: "Rekam medis berhasil dibuat" },
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