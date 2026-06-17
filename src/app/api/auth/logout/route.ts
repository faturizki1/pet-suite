import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({
    data: null,
    message: "Logout berhasil",
  });

  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  });

  return response;
}