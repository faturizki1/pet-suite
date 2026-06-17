import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { appointments } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { CreateAppointmentSchema } from "@/lib/validations/appointment";
import { eq, and, gte, lte } from "drizzle-orm";

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
    const dokterId = searchParams.get("dokter_id");
    const status = searchParams.get("status");
    const tglDari = searchParams.get("tgl_dari");
    const tglSampai = searchParams.get("tgl_sampai");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20"),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];

    // Dokter only sees their own appointments
    if (payload.role === "dokter") {
      conditions.push(eq(appointments.dokterId, payload.sub));
    } else if (dokterId) {
      conditions.push(eq(appointments.dokterId, dokterId));
    }

    if (status) {
      conditions.push(eq(appointments.status, status));
    }

    if (tglDari) {
      conditions.push(gte(appointments.tglJanji, new Date(tglDari)));
    }

    if (tglSampai) {
      conditions.push(lte(appointments.tglJanji, new Date(tglSampai)));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.appointments.findMany({
      where,
      with: {
        pet: {
          columns: {
            id: true,
            nama: true,
            spesies: true,
          },
        },
        dokter: {
          columns: {
            id: true,
            namaLengkap: true,
          },
        },
        customer: {
          columns: {
            id: true,
            namaLengkap: true,
            noHp: true,
          },
        },
      },
      limit,
      offset,
      orderBy: (appointments, { desc }) => [desc(appointments.tglJanji)],
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

    // Customer cannot create appointments directly (only via booking)
    if (payload.role === "customer") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = CreateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const [appointment] = await db
      .insert(appointments)
      .values({
        petId: parsed.data.pet_id,
        dokterId: parsed.data.dokter_id,
        customerId: payload.sub,
        tglJanji: new Date(parsed.data.tgl_janji),
        jenis: parsed.data.jenis,
        keluhan: parsed.data.keluhan,
        sumber: "langsung",
      })
      .returning();

    return NextResponse.json(
      { data: appointment, message: "Appointment berhasil dibuat" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}