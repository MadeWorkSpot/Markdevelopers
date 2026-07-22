import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_PREFIX = process.env.ADMIN_HOST_PREFIX || "admin.";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Use only the Host header for security decisions — x-forwarded-host can be
  // spoofed by clients and must not be trusted for access control or redirects.
  const hostHeader = request.headers.get("host") || "";
  const host = hostHeader.split(":")[0];

  const isAdmin = host.startsWith(ADMIN_PREFIX);

  if (isAdmin) {
    const origin = `${request.nextUrl.protocol}//${host}`;

    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/dashboard", origin));
    }

    const session = request.cookies.get("session")?.value;
    const isLoginRoute = pathname === "/admin/login";

    if (isLoginRoute && session) {
      return NextResponse.redirect(new URL("/admin/dashboard", origin));
    }

    if (!isLoginRoute && !session) {
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
