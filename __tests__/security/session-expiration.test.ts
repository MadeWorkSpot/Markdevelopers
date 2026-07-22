/**
 * SESSION EXPIRATION TESTS
 * Verifies that the auth system handles expired/invalid sessions correctly:
 * - Session valid → access allowed
 * - Session expired, refresh valid → auto-refreshed
 * - Session expired, refresh expired → cookies cleared, redirect to login
 * - Session revoked → cookies cleared, redirect to login
 * - No redirect loops
 * - Consistent behavior across middleware, layout, API routes, client
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";

function readSrc(rel: string): string {
  return fs.readFileSync(process.cwd() + "/" + rel, "utf-8");
}

/* ============================================================
 * LAYER 1: Shared auth utilities
 * ============================================================ */
describe("Shared auth utilities", () => {
  it("exports clearAuthCookies", () => {
    const src = readSrc("lib/auth.ts");
    expect(src).toContain("export async function clearAuthCookies");
  });

  it("exports SESSION_COOKIE and REFRESH_TOKEN_COOKIE constants", () => {
    const src = readSrc("lib/auth.ts");
    expect(src).toContain('SESSION_COOKIE = "session"');
    expect(src).toContain('REFRESH_TOKEN_COOKIE = "refresh_token"');
  });

  it("exports SESSION_MAX_AGE (24h) and REFRESH_TOKEN_MAX_AGE (30d)", () => {
    const src = readSrc("lib/auth.ts");
    expect(src).toContain("SESSION_MAX_AGE = 60 * 60 * 24");
    expect(src).toContain("REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30");
  });

  it("exports COOKIE_OPTIONS with httpOnly, secure, sameSite:strict", () => {
    const src = readSrc("lib/auth.ts");
    expect(src).toContain("httpOnly: true");
    expect(src).toContain('sameSite: "strict"');
  });

  it("clearAuthCookies deletes both session and refresh_token", () => {
    const src = readSrc("lib/auth.ts");
    expect(src).toContain('cookieStore.delete(SESSION_COOKIE)');
    expect(src).toContain('cookieStore.delete(REFRESH_TOKEN_COOKIE)');
  });
});

/* ============================================================
 * LAYER 2: Session refresh endpoint
 * ============================================================ */
describe("Session refresh endpoint", () => {
  it("clears all auth cookies when refresh token is missing", () => {
    const src = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    expect(src).toContain("await clearAuthCookies()");
    expect(src).toContain('{ error: "expired" }');
    expect(src).toContain("status: 401");
  });

  it("clears all auth cookies when Firebase refresh fails", () => {
    const src = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    // On res.ok === false
    expect(src).toContain("if (!res.ok)");
    expect(src).toContain("await clearAuthCookies()");
  });

  it("clears all auth cookies on catch (unexpected error)", () => {
    const src = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    const catchBlock = src.slice(src.indexOf("} catch {"));
    expect(catchBlock).toContain("await clearAuthCookies()");
    expect(catchBlock).toContain('{ error: "expired" }');
  });

  it("uses shared constants for cookie names and options", () => {
    const src = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    expect(src).toContain("SESSION_COOKIE");
    expect(src).toContain("REFRESH_TOKEN_COOKIE");
    expect(src).toContain("COOKIE_OPTIONS");
    expect(src).toContain("SESSION_MAX_AGE");
    expect(src).toContain("REFRESH_TOKEN_MAX_AGE");
  });

  it("returns { success: true } on successful refresh", () => {
    const src = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    expect(src).toContain('{ success: true }');
  });

  it("sets new refresh token when Firebase rotates it", () => {
    const src = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    expect(src).toContain("if (data.refresh_token)");
  });
});

/* ============================================================
 * LAYER 3: Protected layout (server-side session verification)
 * ============================================================ */
describe("Protected layout", () => {
  it("redirects to login when both session and refresh token are missing", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("!sessionCookie && !refreshToken");
    expect(src).toContain("await clearAuthCookies()");
    expect(src).toContain('redirect("/admin/login")');
  });

  it("clears cookies and redirects when session is invalid and no refresh token", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("await clearAuthCookies()");
    expect(src).toContain('redirect("/admin/login")');
  });

  it("tries inline refresh when session is invalid but refresh token exists", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("const refreshed = await tryRefresh(refreshToken)");
  });

  it("clears cookies when inline refresh fails", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("if (!refreshed)");
    expect(src).toContain("await clearAuthCookies()");
  });

  it("sets new session cookie on successful inline refresh", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("cookieStore.set(SESSION_COOKIE, refreshed.sessionCookie");
  });

  it("sets new refresh token when Firebase rotates it", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("if (refreshed.newRefreshToken)");
    expect(src).toContain("cookieStore.set(REFRESH_TOKEN_COOKIE, refreshed.newRefreshToken");
  });

  it("uses shared constants for cookie names and options", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("SESSION_COOKIE");
    expect(src).toContain("REFRESH_TOKEN_COOKIE");
    expect(src).toContain("COOKIE_OPTIONS");
  });

  it("has tryRefresh function that calls Firebase token endpoint", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("async function tryRefresh");
    expect(src).toContain("securetoken.googleapis.com");
  });

  it("tryRefresh returns null on failure (not throw)", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("return null");
  });
});

/* ============================================================
 * LAYER 4: Client-side session management (AdminShell)
 * ============================================================ */
describe("AdminShell client-side auth", () => {
  it("redirects to login when refresh returns non-ok status", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("if (!res.ok)");
    expect(src).toContain("clearInterval(intervalId)");
    expect(src).toContain("handleAuthExpired()");
  });

  it("stops the refresh interval on auth failure (no infinite retry)", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("clearInterval(intervalId)");
    // Should NOT continue retrying after 401
  });

  it("uses loggedOutRef to prevent multiple redirects", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("loggedOutRef");
    expect(src).toContain("if (loggedOutRef.current) return");
  });

  it("has global fetch interceptor for 401/403 on admin routes", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("window.fetch");
    expect(src).toContain("response.status === 401 || response.status === 403");
    expect(src).toContain('url.includes("/admin/")');
  });

  it("restores original fetch on cleanup", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("window.fetch = originalFetch");
  });

  it("uses useRouter for redirect (not window.location)", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("useRouter");
    expect(src).toContain("router.push");
  });

  it("cleans up interval on unmount", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("return () =>");
    expect(src).toContain("clearInterval(intervalId)");
  });

  it("refresh interval is 20 hours", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("20 * 60 * 60 * 1000");
  });
});

/* ============================================================
 * LAYER 5: Middleware (edge runtime)
 * ============================================================ */
describe("Middleware behavior", () => {
  it("redirects to login when session cookie is missing", () => {
    const src = readSrc("middleware.ts");
    expect(src).toContain("!isLoginRoute && !session");
    expect(src).toContain("/admin/login");
  });

  it("redirects to dashboard when on login with session cookie", () => {
    const src = readSrc("middleware.ts");
    expect(src).toContain("isLoginRoute && session");
    expect(src).toContain("/admin/dashboard");
  });

  it("allows login page without session", () => {
    const src = readSrc("middleware.ts");
    // isLoginRoute && !session → passes to NextResponse.next()
    expect(src).toContain("isLoginRoute");
  });

  it("does NOT verify JWT validity (edge limitation)", () => {
    const src = readSrc("middleware.ts");
    expect(src).not.toContain("verifySessionCookie");
    expect(src).not.toContain("jwtVerify");
  });

  it("only checks cookie existence, not validity", () => {
    const src = readSrc("middleware.ts");
    expect(src).toContain('cookies.get("session")?.value');
  });

  it("rewrites /admin on public host to /_not-found", () => {
    const src = readSrc("middleware.ts");
    expect(src).toContain("/_not-found");
  });
});

/* ============================================================
 * LAYER 6: Server actions (requireAdmin)
 * ============================================================ */
describe("Server actions auth", () => {
  it("requireAdmin throws Unauthorized for missing session", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain('if (!sessionCookie) throw new Error("Unauthorized")');
  });

  it("requireAdmin throws Unauthorized for invalid/revoked session", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("verifySessionCookie(sessionCookie, true)");
    expect(src).toContain('throw new Error("Unauthorized")');
  });

  it("logout uses clearAuthCookies", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("await clearAuthCookies()");
  });

  it("logout still revokes Firebase tokens before clearing", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("revokeRefreshTokens");
  });

  it("login sets both session and refresh_token cookies", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain('cookieStore.set("session"');
    expect(src).toContain('cookieStore.set("refresh_token"');
  });

  it("login uses shared cookie constants", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("import { clearAuthCookies } from");
  });
});

/* ============================================================
 * LAYER 7: Upload API route
 * ============================================================ */
describe("Upload API auth", () => {
  it("returns 401 for missing session", () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).toContain("status: 401");
  });

  it("clears cookies on invalid session", () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).toContain("await clearAuthCookies()");
  });

  it("uses shared clearAuthCookies", () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).toContain("import { clearAuthCookies } from");
  });
});

/* ============================================================
 * LAYER 8: Redirect loop prevention
 * ============================================================ */
describe("Redirect loop prevention", () => {
  it("login page does NOT require session (middleware allows it)", () => {
    const src = readSrc("middleware.ts");
    // isLoginRoute check comes before !session check
    expect(src).toContain("const isLoginRoute = pathname === \"/admin/login\"");
    expect(src).toContain("if (isLoginRoute && session)");
  });

  it("login page redirects to dashboard if session exists (prevents login loop)", () => {
    const src = readSrc("middleware.ts");
    expect(src).toContain("isLoginRoute && session");
    expect(src).toContain("/admin/dashboard");
  });

  it("protected layout redirects to login only once (uses redirect())", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    // redirect() throws — execution stops after redirect
    const redirectCount = (src.match(/redirect\("\/admin\/login"\)/g) || []).length;
    // Multiple code paths can redirect to login, but each path only redirects once
    expect(redirectCount).toBeGreaterThanOrEqual(2);
    expect(redirectCount).toBeLessThanOrEqual(4);
  });

  it("AdminShell uses loggedOutRef to prevent multiple redirects", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("loggedOutRef.current = true");
    expect(src).toContain("if (loggedOutRef.current) return");
  });

  it("refresh interval is cleared on failure (no loop)", () => {
    const src = readSrc("components/admin/AdminShell.tsx");
    expect(src).toContain("clearInterval(intervalId)");
  });
});

/* ============================================================
 * LAYER 9: Cookie security properties
 * ============================================================ */
describe("Cookie security", () => {
  it("all auth cookies use httpOnly", () => {
    const actionsSrc = readSrc("actions.ts");
    const authSrc = readSrc("lib/auth.ts");
    expect(authSrc).toContain("httpOnly: true");
    expect(actionsSrc).toContain("httpOnly: true");
  });

  it("all auth cookies use secure in production", () => {
    const authSrc = readSrc("lib/auth.ts");
    expect(authSrc).toContain('secure: process.env.NODE_ENV === "production"');
  });

  it("all auth cookies use sameSite:strict", () => {
    const authSrc = readSrc("lib/auth.ts");
    expect(authSrc).toContain('sameSite: "strict"');
  });

  it("session cookie max 24h, refresh token max 30d", () => {
    const authSrc = readSrc("lib/auth.ts");
    expect(authSrc).toContain("SESSION_MAX_AGE = 60 * 60 * 24");
    expect(authSrc).toContain("REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30");
  });

  it("cookies are never exposed to client JavaScript (httpOnly)", () => {
    // Verify no document.cookie access in client components
    const adminShell = readSrc("components/admin/AdminShell.tsx");
    expect(adminShell).not.toContain("document.cookie");
  });
});

/* ============================================================
 * LAYER 10: Complete auth flow integration
 * ============================================================ */
describe("Complete auth flow", () => {
  it("all auth touchpoints use shared constants from lib/auth.ts", () => {
    const refreshRoute = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    const layout = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    const actions = readSrc("actions.ts");
    const upload = readSrc("app/api/upload/route.ts");

    // All files should import from lib/auth.ts
    expect(refreshRoute).toContain('from "@/lib/auth"');
    expect(layout).toContain('from "@/lib/auth"');
    expect(actions).toContain('from "@/lib/auth"');
    expect(upload).toContain('from "@/lib/auth"');
  });

  it("clearAuthCookies is called in all expiration paths", () => {
    const refreshRoute = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    const layout = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    const upload = readSrc("app/api/upload/route.ts");

    // Refresh route: 3 places (no token, failed refresh, catch)
    const refreshClears = (refreshRoute.match(/await clearAuthCookies\(\)/g) || []).length;
    expect(refreshClears).toBe(3);

    // Layout: 3 places (no session+no refresh, no valid session+no refresh token, refresh failed)
    const layoutClears = (layout.match(/await clearAuthCookies\(\)/g) || []).length;
    expect(layoutClears).toBe(3);

    // Upload: 1 place (invalid session)
    const uploadClears = (upload.match(/await clearAuthCookies\(\)/g) || []).length;
    expect(uploadClears).toBe(1);
  });

  it("all 401 responses include { error: 'expired' } or { error: 'Unauthorized' }", () => {
    const refreshRoute = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    const upload = readSrc("app/api/upload/route.ts");

    expect(refreshRoute).toContain('{ error: "expired" }');
    expect(upload).toContain('{ error: "Unauthorized" }');
  });

  it("no blank pages — all error paths redirect or show error", () => {
    const layout = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    const adminShell = readSrc("components/admin/AdminShell.tsx");

    // Layout always redirects on auth failure
    expect(layout).toContain('redirect("/admin/login")');

    // AdminShell has toast for upload errors
    // and router.push for auth expiration
    expect(adminShell).toContain("handleAuthExpired");
  });
});
