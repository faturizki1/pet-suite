import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { medicalRecords, profiles } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { eq, and, gte, lte } from "drizzle-orm";

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

    const { searchParams } = new URL(request.url);
    const tglDari = searchParams.get("tgl_dari");
    const tglSampai = searchParams.get("tgl_sampai");

    const conditions = [];
    if (tglDari) conditions.push(gte(medicalRecords.tanggal, new Date(tglDari)));
    if (tglSampai) conditions.push(lte(medicalRecords.tanggal, new Date(tglSampai)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const records = await db.query.medicalRecords.findMany({
      where,
      with: {
        dokter: { columns: { id: true, namaLengkap: true } },
      },
    });

    // Aggregate by doctor
    const grouped: Record<string, { nama: string; pasien: number }> = {};
    for (const r of records) {
      const id = r.dokterId;
      if (!grouped[id]) {
        grouped[id] = { nama: r.dokter.namaLengkap, pasien: 0 };
      }
      grouped[id].pasien++;
    }

    const data = Object.values(grouped).sort((a, b) => b.pasien - a.pasien);

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}