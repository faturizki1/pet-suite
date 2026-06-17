import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { onlineBookings, bookingSlots, appointments, pets } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { assertActiveUser } from "@/lib/auth/guard";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }
    if (payload.role !== "staff" && payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    await assertActiveUser(payload.sub);

    const body = await request.json();
    const { status, alasan_tolak } = body;

    const booking = await db.query.onlineBookings.findFirst({
      where: eq(onlineBookings.id, params.id),
      with: { slot: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 });
    }

    const result = await db.transaction(async (tx) => {
      if (status === "dikonfirmasi") {
        // Create appointment
        const [appointment] = await tx
          .insert(appointments)
          .values({
            petId: booking.customerId || booking.namaHewan, // fallback
            dokterId: booking.slot.dokterId,
            customerId: booking.customerId || undefined as unknown as string,
            tglJanji: new Date(
              `${booking.slot.tanggal}T${booking.slot.jamMulai}`
            ),
            jenis: "konsultasi",
            keluhan: booking.keluhan,
            sumber: "online",
          })
          .returning();

        await tx
          .update(onlineBookings)
          .set({ status: "dikonfirmasi", appointmentId: appointment.id })
          .where(eq(onlineBookings.id, params.id));

        return { status: "dikonfirmasi", appointment };
      } else if (status === "ditolak") {
        // Decrement slot terisi
        await tx
          .update(bookingSlots)
          .set({
            terisi: Math.max(0, booking.slot.terisi! - 1),
            isAvailable: true,
          })
          .where(eq(bookingSlots.id, booking.slotId));

        await tx
          .update(onlineBookings)
          .set({ status: "ditolak", alasanTolak: alasan_tolak || null })
          .where(eq(onlineBookings.id, params.id));

        return { status: "ditolak" };
      } else if (status === "selesai") {
        await tx
          .update(onlineBookings)
          .set({ status: "selesai" })
          .where(eq(onlineBookings.id, params.id));

        return { status: "selesai" };
      }

      throw new Error("INVALID_STATUS");
    });

    return NextResponse.json({
      data: result,
      message: `Booking ${status === "dikonfirmasi" ? "dikonfirmasi" : status === "ditolak" ? "ditolak" : "diselesaikan"}`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED_INACTIVE") {
        return NextResponse.json({ error: "Akun tidak aktif" }, { status: 403 });
      }
      if (error.message === "INVALID_STATUS") {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}