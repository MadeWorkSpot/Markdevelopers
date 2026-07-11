import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_PREFIX = process.env.ADMIN_HOST_PREFIX || "admin.";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(":")[0];

  const isAdmin = host.startsWith(ADMIN_PREFIX);

  // ── Admin subdomain (admin.markdevelopers.in) ────────────────
  if (isAdmin) {
    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL("/admin/dashboard", `${request.nextUrl.protocol}//${host}`)
      );
    }

    const session = request.cookies.get("session")?.value;

    const publicRoutes = [
      "/admin/login",
      "/admin/signup",
      "/admin/forgot-password",
    ];
    const isPublicRoute =
      publicRoutes.includes(pathname) ||
      pathname.startsWith("/admin/reset-password") ||
      pathname.startsWith("/admin/verify-email");

    if (isPublicRoute && session) {
      return NextResponse.redirect(
        new URL("/admin/dashboard", `${request.nextUrl.protocol}//${host}`)
      );
    }

    if (!isPublicRoute && !session) {
      return NextResponse.redirect(
        new URL("/admin/login", `${request.nextUrl.protocol}//${host}`)
      );
    }

    return NextResponse.next();
  }

  // ── Public site (markdevelopers.in) ──────────────────────────
  if (pathname.startsWith("/admin")) {
    return NextResponse.rewrite(new URL("/_not-found", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
