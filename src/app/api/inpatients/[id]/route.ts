import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { inpatients } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
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

    const inpatient = await db.query.inpatients.findFirst({
      where: eq(inpatients.id, params.id),
      with: {
        pet: true,
        dokter: {
          columns: {
            id: true,
            namaLengkap: true,
          },
        },
        logs: {
          with: {
            staff: {
              columns: {
                id: true,
                namaLengkap: true,
              },
            },
          },
          orderBy: (logs, { desc }) => [desc(logs.timestamp)],
        },
      },
    });

    if (!inpatient) {
      return NextResponse.json(
        { error: "Data rawat inap tidak ditemukan" },
        { status: 404 }
      );
    }

    // Customer can only view their own pets
    if (
      payload.role === "customer" &&
      inpatient.pet.ownerId !== payload.sub
    ) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: inpatient });
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

    // Only dokter and owner can update inpatient status
    if (payload.role !== "dokter" && payload.role !== "owner") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Sensitive endpoint — re-check is_active
    await assertActiveUser(payload.sub);

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.tgl_keluar) updateData.tglKeluar = new Date(body.tgl_keluar);
    if (body.diagnosis_awal) updateData.diagnosisAwal = body.diagnosis_awal;
    if (body.tindakan_awal) updateData.tindakanAwal = body.tindakan_awal;
    if (body.no_kandang) updateData.noKandang = body.no_kandang;

    const [updated] = await db
      .update(inpatients)
      .set(updateData)
      .where(eq(inpatients.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Data rawat inap tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updated,
      message: "Status rawat inap berhasil diperbarui",
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