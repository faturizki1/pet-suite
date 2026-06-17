import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { inpatientLogs, inpatients } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { CreateInpatientLogSchema } from "@/lib/validations/inpatient";
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
      with: { pet: { columns: { ownerId: true } } },
    });

    if (!inpatient) {
      return NextResponse.json(
        { error: "Data rawat inap tidak ditemukan" },
        { status: 404 }
      );
    }

    // Customer can only view their own pets' logs
    if (
      payload.role === "customer" &&
      inpatient.pet.ownerId !== payload.sub
    ) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const logs = await db.query.inpatientLogs.findMany({
      where: eq(inpatientLogs.inpatientId, params.id),
      with: {
        staff: {
          columns: {
            id: true,
            namaLengkap: true,
          },
        },
      },
      orderBy: (logs, { desc }) => [desc(logs.timestamp)],
    });

    // Filter visible logs for customer
    const filtered =
      payload.role === "customer"
        ? logs.filter((l) => l.isVisibleCustomer)
        : logs;

    return NextResponse.json({ data: filtered });
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

    // Only dokter, staff, and owner can create logs
    if (
      payload.role !== "dokter" &&
      payload.role !== "staff" &&
      payload.role !== "owner"
    ) {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    // Sensitive endpoint — re-check is_active
    await assertActiveUser(payload.sub);

    const inpatient = await db.query.inpatients.findFirst({
      where: eq(inpatients.id, params.id),
    });

    if (!inpatient) {
      return NextResponse.json(
        { error: "Data rawat inap tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = CreateInpatientLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const [log] = await db
      .insert(inpatientLogs)
      .values({
        inpatientId: params.id,
        staffId: payload.sub,
        kondisi: parsed.data.kondisi,
        berat: parsed.data.berat?.toString(),
        suhu: parsed.data.suhu?.toString(),
        nafsuMakan: parsed.data.nafsu_makan,
        catatanKondisi: parsed.data.catatan_kondisi,
        tindakanHariIni: parsed.data.tindakan_hari_ini,
        obatHariIni: parsed.data.obat_hari_ini,
        fotoUrls: parsed.data.foto_urls || [],
        isVisibleCustomer: parsed.data.is_visible_customer,
      })
      .returning();

    return NextResponse.json(
      { data: log, message: "Log monitoring berhasil ditambahkan" },
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