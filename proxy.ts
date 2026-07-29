import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Use only the Host header for security decisions — x-forwarded-host can be
  // spoofed by clients and must not be trusted for access control or redirects.
  const hostHeader = request.headers.get("host") || "";
  const host = hostHeader.split(":")[0];

  const ADMIN_PREFIX =
    host.includes("localhost") || host.includes("127.0.0.1")
      ? process.env.ADMIN_HOST_PREFIX_DEV || "admin."
      : process.env.ADMIN_HOST_PREFIX || "admindashboard.";

  const isAdmin = host.startsWith(ADMIN_PREFIX);

  if (isAdmin) {
    const origin = `${request.nextUrl.protocol}//${hostHeader}`;

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
