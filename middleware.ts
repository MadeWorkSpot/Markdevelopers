import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ADMIN_PREFIX = process.env.ADMIN_HOST_PREFIX || "admin.";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostWithPort = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = hostWithPort.split(":")[0];

  const isAdmin = host.startsWith(ADMIN_PREFIX);

  if (isAdmin) {
    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL("/admin/dashboard", `${request.nextUrl.protocol}//${hostWithPort}`)
      );
    }

    const session = request.cookies.get("session")?.value;
    const isLoginRoute = pathname === "/admin/login";

    if (isLoginRoute && session) {
      return NextResponse.redirect(
        new URL("/admin/dashboard", `${request.nextUrl.protocol}//${hostWithPort}`)
      );
    }

    if (!isLoginRoute && !session) {
      return NextResponse.redirect(
        new URL("/admin/login", `${request.nextUrl.protocol}//${hostWithPort}`)
      );
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
