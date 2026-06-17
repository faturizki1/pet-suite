import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { bookingSlots } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

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
    if (payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    const result = await db.query.bookingSlots.findMany({
      with: { dokter: { columns: { id: true, namaLengkap: true } } },
      orderBy: (s, { desc }) => [desc(s.tanggal), desc(s.jamMulai)],
    });

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const payload = await verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }
    if (payload.role !== "owner") {
      return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
    }

    const body = await request.json();
    const [slot] = await db
      .insert(bookingSlots)
      .values({
        dokterId: body.dokter_id || null,
        tanggal: body.tanggal,
        jamMulai: body.jam_mulai,
        jamSelesai: body.jam_selesai,
        kuota: body.kuota || 1,
      })
      .returning();

    return NextResponse.json(
      { data: slot, message: "Slot berhasil dibuat" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}