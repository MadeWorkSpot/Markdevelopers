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
} from "@/lib/auth";

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

export async function POST() {
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
  try {
    const result = await doRefresh();
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/admin/dashboard";
    if (!result.ok) {
      return NextResponse.redirect(new URL(result.redirectTo, request.url));
    }
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}
