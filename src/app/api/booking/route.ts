import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { onlineBookings, bookingSlots } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { CreateBookingSchema } from "@/lib/validations/booking";
import { eq, and, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions = [];
    if (status) conditions.push(eq(onlineBookings.status, status));

    // Customer only sees their own bookings
    if (payload.role === "customer") {
      conditions.push(eq(onlineBookings.customerId, payload.sub));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await db.query.onlineBookings.findMany({
      where,
      with: {
        slot: {
          with: {
            dokter: { columns: { id: true, namaLengkap: true } },
          },
        },
        customer: { columns: { id: true, namaLengkap: true, noHp: true } },
      },
      limit,
      offset,
      orderBy: (b, { desc }) => [desc(b.createdAt)],
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    // Atomic transaction — semua dalam SATU db.transaction() dengan row lock
    const result = await db.transaction(async (tx) => {
      // Row lock pada slot — cegah overbooking
      const [locked] = await tx.execute(
        sql`SELECT id, kuota, terisi, is_available FROM booking_slots WHERE id = ${parsed.data.slot_id}::uuid FOR UPDATE`
      );

      if (!locked) {
        throw new Error("SLOT_NOT_FOUND");
      }

      const slot = locked as {
        id: string;
        kuota: number;
        terisi: number;
        is_available: boolean;
      };

      if (!slot.is_available) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      if (slot.terisi >= slot.kuota) {
        throw new Error("SLOT_FULL");
      }

      // Atomic increment terisi
      const newTerisi = slot.terisi + 1;
      await tx
        .update(bookingSlots)
        .set({
          terisi: newTerisi,
          isAvailable: newTerisi < slot.kuota,
        })
        .where(eq(bookingSlots.id, slot.id));

      // Create booking
      const [booking] = await tx
        .insert(onlineBookings)
        .values({
          slotId: parsed.data.slot_id,
          customerId: parsed.data.customer_id || null,
          namaGuest: parsed.data.nama_guest || null,
          noHpGuest: parsed.data.no_hp_guest || null,
          namaHewan: parsed.data.nama_hewan,
          spesies: parsed.data.spesies,
          keluhan: parsed.data.keluhan || null,
        })
        .returning();

      return booking;
    });

    return NextResponse.json(
      { data: result, message: "Booking berhasil dikirim" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SLOT_NOT_FOUND") {
        return NextResponse.json({ error: "Slot tidak ditemukan" }, { status: 404 });
      }
      if (error.message === "SLOT_UNAVAILABLE") {
        return NextResponse.json({ error: "Slot tidak tersedia" }, { status: 409 });
      }
      if (error.message === "SLOT_FULL") {
        return NextResponse.json({ error: "Slot sudah penuh" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}