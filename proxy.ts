import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getEnvConfig } from "@/lib/envConfig";

const { publicHost: PUBLIC_HOST, adminPrefix: ADMIN_PREFIX } = getEnvConfig();

export function proxy(request: NextRequest) {
  
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  const isPublicHost = host === PUBLIC_HOST;
  const isAdminHost = ADMIN_PREFIX ? host.startsWith(ADMIN_PREFIX) : false;


  if (!isPublicHost && !isAdminHost) {
    const scheme = request.nextUrl.protocol;
    const target = `${scheme}//${PUBLIC_HOST}/`;
    return new Response(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${target}"></head><body><a href="${target}">Redirect</a></body></html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          Refresh: `0; url=${target}`,
        },
      },
    );
  }

  // ── Public host (example.com / localhost:3000) ──────────────
  if (isPublicHost) {
    if (pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL("/_not-found", request.url));
    }
    return NextResponse.next();
  }

  // ── Admin host (admin.example.com / admin.localhost:3000) ───
  const protocol = request.nextUrl.protocol;
  const adminHost = `${ADMIN_PREFIX}${PUBLIC_HOST}`;

  // Block any non-admin path (catches /, /about, /contact, etc.)
  if (!pathname.startsWith("/admin")) {
    return NextResponse.redirect(
      new URL("/admin/dashboard", `${protocol}//${adminHost}`)
    );
  }

  // Auth guard – protect all /admin/* routes except login/signup/verify
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    pathname !== "/admin/signup" &&
    pathname !== "/admin/forgot-password" &&
    !pathname.startsWith("/admin/reset-password") &&
    !pathname.startsWith("/admin/verify-email")
  ) {
    const session = request.cookies.get("session");
    if (!session?.value) {
      return NextResponse.redirect(
        new URL("/admin/login", `${protocol}//${adminHost}`)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
