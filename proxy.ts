import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(":")[0];

  const isAdmin = host.startsWith("admin.");

  // ── Admin subdomain (admin.markdevelopers.in) ────────────────
  if (isAdmin) {
    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL("/admin/dashboard", `${request.nextUrl.protocol}//${host}`)
      );
    }

    const publicRoutes = [
      "/admin/login",
      "/admin/signup",
      "/admin/forgot-password",
    ];
    const isPublicRoute =
      publicRoutes.includes(pathname) ||
      pathname.startsWith("/admin/reset-password") ||
      pathname.startsWith("/admin/verify-email");

    if (!isPublicRoute) {
      const session = request.cookies.get("session");
      if (!session?.value) {
        return NextResponse.redirect(
          new URL("/admin/login", `${request.nextUrl.protocol}//${host}`)
        );
      }
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
