import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { clinicInfo } from "@/db/schema";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";
import { UpdateClinicInfoSchema } from "@/lib/validations/settings";
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

    const info = await db.query.clinicInfo.findFirst();
    return NextResponse.json({ data: info || null });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const parsed = UpdateClinicInfoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validasi gagal", code: parsed.error.message },
        { status: 400 }
      );
    }

    const existing = await db.query.clinicInfo.findFirst();

    let result;
    if (existing) {
      [result] = await db
        .update(clinicInfo)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(clinicInfo.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(clinicInfo)
        .values({
          namaKlinik: parsed.data.nama_klinik || "Klinik Hewan",
          alamat: parsed.data.alamat,
          noHp: parsed.data.no_hp,
          email: parsed.data.email,
          jamBuka: parsed.data.jam_buka || [],
          logoUrl: parsed.data.logo_url,
          footerStruk: parsed.data.footer_struk,
        })
        .returning();
    }

    return NextResponse.json({
      data: result,
      message: "Informasi klinik berhasil diperbarui",
    });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}