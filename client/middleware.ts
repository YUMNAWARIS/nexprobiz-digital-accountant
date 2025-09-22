import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCESS_TOKEN, COOKIE_ROLE, ROUTE_LOGIN } from "@/constants";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth");
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.startsWith("/favicon") || pathname.startsWith("/public");

  if (isStatic || isAuthRoute) return NextResponse.next();

  const token = request.cookies.get(COOKIE_ACCESS_TOKEN)?.value;
  const role = request.cookies.get(COOKIE_ROLE)?.value;

  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTE_LOGIN;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Role-based gates
  const isMasterRoute = pathname.startsWith("/master");
  const isBusinessRoute = pathname.startsWith("/business");

  if (isMasterRoute && role !== "master") {
    const url = request.nextUrl.clone();
    url.pathname = "/business";
    return NextResponse.redirect(url);
  }

  if (isBusinessRoute && role === "master") {
    const url = request.nextUrl.clone();
    url.pathname = "/master";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|.*\\.\(?:svg|png|jpg|jpeg|gif|webp|ico\)$|api).*)",
  ],
};


