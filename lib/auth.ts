import { cookies } from "next/headers";

export const SESSION_COOKIE = "session";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
} as const;

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export function setSessionCookie(sessionCookie: string) {
  return { ...COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE, value: sessionCookie };
}

export function setRefreshTokenCookie(refreshToken: string) {
  return { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_MAX_AGE, value: refreshToken };
}

export function isAdminHost(host: string, adminPrefix: string): boolean {
  return host.startsWith(adminPrefix);
}

export function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") && pathname !== "/admin/login";
}
