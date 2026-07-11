import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(":")[0];

  const isVercel = host.endsWith(".vercel.app");
  const isLocalhost = host.startsWith("localhost");
  const isAdminSubdomain = host.startsWith("admin.");

  const isProductionHost = isVercel || isLocalhost;

  if (!isProductionHost && !isAdminSubdomain) {
    const protocol = request.nextUrl.protocol;
    return NextResponse.redirect(new URL(`${protocol}//${request.headers.get("host")}/`));
  }

  // ── Admin subdomain (admin.example.com / admin.xxx.vercel.app) ───
  if (isAdminSubdomain) {
    const baseHost = host.replace(/^admin\./, "");
    const adminHost = host;

    if (!pathname.startsWith("/admin")) {
      return NextResponse.redirect(
        new URL("/admin/dashboard", `${request.nextUrl.protocol}//${adminHost}`)
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
          new URL("/admin/login", `${request.nextUrl.protocol}//${adminHost}`)
        );
      }
    }

    return NextResponse.next();
  }

  // ── Public host (markdevelopers.vercel.app / localhost:3000) ──
  if (isProductionHost) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL("/_not-found", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
