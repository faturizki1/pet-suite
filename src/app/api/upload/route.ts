import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

const ALLOWED_FOLDERS = [
  "pets",
  "inpatient-logs",
  "products",
  "expenses",
  "profiles",
  "clinic",
  "general",
] as const;

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "File wajib diunggah" }, { status: 400 });
    }

    // Validate folder — whitelist sesuai konvensi ARSITEKTUR.md
    if (!ALLOWED_FOLDERS.includes(folder as typeof ALLOWED_FOLDERS[number])) {
      return NextResponse.json(
        { error: `Folder tidak diizinkan. Gunakan: ${ALLOWED_FOLDERS.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file type
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const allowedTypes = Object.keys(MIME_TO_EXT);
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak diizinkan. Hanya jpg, png, webp" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Derive extension from validated MIME type, NOT from user-controlled file.name
    const ext = MIME_TO_EXT[file.type] || "jpg";
    const timestamp = Date.now();
    const path = `${folder}/${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Upload to MinIO
    const { uploadFile } = await import("@/lib/storage/client");
    const url = await uploadFile(path, buffer, file.type);

    return NextResponse.json(
      { data: { url, path }, message: "File berhasil diunggah" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}