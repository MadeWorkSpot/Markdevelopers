import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase-admin";
import {
  SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  clearAuthCookies,
  assertAdminEmail,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { safeRedirectPath } from "@/lib/safe-redirect";

// Generous per-IP budget so normal users (at most one refresh per ~24h) are
// never affected, while runaway/abusive clients are stopped. This does not
// create a DoS vector because each IP is limited independently.
const REFRESH_RATE_LIMIT = 120;

async function doRefresh() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    await clearAuthCookies();
    return { ok: false as const, redirectTo: "/admin/login" };
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    return { ok: false as const, redirectTo: "/admin/login" };
  }

  const res = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    await clearAuthCookies();
    return { ok: false as const, redirectTo: "/admin/login" };
  }

  const sessionCookie = await adminAuth.createSessionCookie(data.id_token, {
    expiresIn: SESSION_MAX_AGE * 1000,
  });

  // Re-verify the freshly minted session and enforce the admin allowlist.
  // A refreshed account that is not on ALLOWED_ADMIN_EMAILS is denied and its
  // cookies are cleared (fail closed).
  try {
    const session = await adminAuth.verifySessionCookie(sessionCookie);
    assertAdminEmail(session.email);
  } catch {
    await clearAuthCookies();
    return { ok: false as const, redirectTo: "/admin/login" };
  }

  cookieStore.set(SESSION_COOKIE, sessionCookie, {
    ...COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE,
  });

  if (data.refresh_token) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  return { ok: true as const };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit("session-refresh", ip, REFRESH_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }
  try {
    const result = await doRefresh();
    if (!result.ok) {
      return NextResponse.json({ error: "expired" }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  } catch {
    await clearAuthCookies();
    return NextResponse.json({ error: "expired" }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit("session-refresh", ip, REFRESH_RATE_LIMIT);
  if (!rl.allowed) {
    // Redirect gracefully instead of exposing a raw 429 body in the browser.
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  try {
    const result = await doRefresh();
    const redirectTo = safeRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
      "/admin/dashboard"
    );
    if (!result.ok) {
      return NextResponse.redirect(new URL(result.redirectTo, request.url));
    }
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}
