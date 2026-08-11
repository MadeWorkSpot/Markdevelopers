import { cookies } from "next/headers";

export { normalizeHost, isAdminHost, getAdminHost, getDevAdminHost } from "./hosts";

export const SESSION_COOKIE = "session";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Decide whether auth cookies must carry the `Secure` attribute.
 *
 * Rule:
 *  - development (NODE_ENV=development)  → false (local HTTP dev server)
 *  - production/staging (NODE_ENV=production) → true, UNLESS the runtime
 *    explicitly declares itself a local runtime via ENVIRONMENT=local.
 *
 * The Secure flag is NEVER coupled to a host override variable such as
 * PUBLIC_HOST_DEV — production must always use secure cookies.
 */
export function shouldUseSecureCookies(
  env: Record<string, string | undefined> = process.env
): boolean {
  if (env.NODE_ENV === "development") return false;
  if (env.NODE_ENV === "production") return env.ENVIRONMENT !== "local";
  // Test/other runtimes default to secure (fail closed).
  return true;
}

export function getCookieOptions(
  env: Record<string, string | undefined> = process.env
): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict";
  path: string;
} {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(env),
    sameSite: "strict",
    path: "/",
  };
}

export const COOKIE_OPTIONS = getCookieOptions();

// ── Admin allowlist ──────────────────────────────────────────────────────────
// Access to the admin panel is restricted to an explicit allowlist of Firebase
// account emails. Missing/empty configuration FAILS CLOSED (no admin access).

export function getAllowedAdminEmails(
  env: Record<string, string | undefined> = process.env
): Set<string> {
  return new Set(
    (env.ALLOWED_ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(
  email: string | undefined | null,
  env: Record<string, string | undefined> = process.env
): boolean {
  if (!email) return false;
  return getAllowedAdminEmails(env).has(email.trim().toLowerCase());
}

export function assertAdminEmail(
  email: string | undefined | null,
  env: Record<string, string | undefined> = process.env
): void {
  if (!isAdminEmail(email, env)) throw new Error("Unauthorized");
}

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

export function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") && pathname !== "/admin/login";
}
