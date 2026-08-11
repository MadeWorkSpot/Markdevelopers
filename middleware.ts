import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAdminHost, normalizeHost } from "@/lib/hosts";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Use only the Host header for security decisions — x-forwarded-host can be
  // spoofed by clients and must not be trusted for access control or redirects.
  const hostHeader = request.headers.get("host") || "";
  const host = normalizeHost(hostHeader);

  // Strict exact-match check: only the configured admin subdomain is treated
  // as the admin host (see lib/auth.ts isAdminHost). Lookalike hosts such as
  // `admindashboard.evil.com` are treated as public.
  const isAdmin = isAdminHost(host);

  if (isAdmin) {
    const origin = `${request.nextUrl.protocol}//${hostHeader}`;

    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", origin));
    }

    const session = request.cookies.get("session")?.value;
    // Routes reachable without a session: login and the forgot-password flow.
    const isAuthRoute =
      pathname === "/admin/login" || pathname.startsWith("/admin/forgot");

    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/admin/dashboard", origin));
    }

    if (!isAuthRoute && !session) {
      return NextResponse.redirect(new URL("/admin/login", origin));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
  runtime: "experimental-edge",
};
