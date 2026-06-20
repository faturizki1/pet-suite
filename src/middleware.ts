import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/session";

const ROLE_ROUTES: Record<string, string[]> = {
  "/owner": ["owner"],
  "/dokter": ["dokter", "owner"],
  "/staff": ["staff", "owner"],
  "/customer": ["customer"],
};

// Public API routes that don't require any session cookie check
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/booking/list",
  "/api/booking",
  "/api/booking/slots",
];

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================================
  // API routes — defense-in-depth: check cookie existence
  // ============================================================
  if (pathname.startsWith("/api/")) {
    // Skip public API routes (auth handled in each route)
    if (isPublicApiRoute(pathname)) {
      return NextResponse.next();
    }

    // Defense-in-depth: check that session cookie exists
    // (actual JWT verification is done in each route handler)
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

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
