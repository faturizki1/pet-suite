import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { bookingSlots } from "@/db/schema";
import { eq, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dokterId = searchParams.get("dokter_id");
    const tanggal = searchParams.get("tanggal");

    const conditions = [];
    conditions.push(eq(bookingSlots.isAvailable, true));

    if (dokterId) {
      conditions.push(eq(bookingSlots.dokterId, dokterId));
    }

    if (tanggal) {
      conditions.push(eq(bookingSlots.tanggal, tanggal));
    } else {
      // Only show future slots
      const today = new Date().toISOString().slice(0, 10);
      conditions.push(gte(bookingSlots.tanggal, today));
    }

    const result = await db.query.bookingSlots.findMany({
      with: {
        dokter: {
          columns: { id: true, namaLengkap: true },
        },
      },
      orderBy: (slots, { asc }) => [asc(slots.tanggal), asc(slots.jamMulai)],
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}