import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { appointments } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { UpdateAppointmentSchema } from "@/lib/validations/appointment";
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

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, params.id),
      with: {
        pet: true,
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
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: appointment });
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

    // Customer cannot update appointments
    if (payload.role === "customer") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = UpdateAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(appointments)
      .set({
        status: parsed.data.status,
        catatanStaff: parsed.data.catatan_staff,
      })
      .where(eq(appointments.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Appointment tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: updated,
      message: "Status appointment berhasil diperbarui",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}