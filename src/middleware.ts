import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

const ROLE_ROUTES: Record<string, string[]> = {
  "/owner": ["owner"],
  "/dokter": ["dokter", "owner"],
  "/staff": ["staff", "owner"],
  "/customer": ["customer"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes — auth handled in each route
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip public routes
  if (pathname === "/" || pathname === "/layanan" || pathname === "/dokter" || pathname === "/booking") {
    return NextResponse.next();
  }

  // Skip login page
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Get session cookie
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify JWT
  const payload = await verifySessionToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Check role against route
  const matchedRole = Object.entries(ROLE_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  );

  if (matchedRole) {
    const [, allowedRoles] = matchedRole;
    if (!allowedRoles.includes(payload.role)) {
      // Redirect to their own dashboard
      return NextResponse.redirect(
        new URL(`/${payload.role}/dashboard`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|public).*)",
  ],
};