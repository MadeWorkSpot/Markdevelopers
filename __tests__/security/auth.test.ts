import { describe, it, expect } from "vitest";
import {
  SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  isAdminHost,
  isProtectedRoute,
} from "@/lib/auth";

describe("auth constants", () => {
  it("exports cookie names", () => {
    expect(SESSION_COOKIE).toBe("session");
    expect(REFRESH_TOKEN_COOKIE).toBe("refresh_token");
  });

  it("exports max ages", () => {
    expect(SESSION_MAX_AGE).toBe(60 * 60 * 24);
    expect(REFRESH_TOKEN_MAX_AGE).toBe(60 * 60 * 24 * 30);
  });

  it("COOKIE_OPTIONS has httpOnly, secure, sameSite strict", () => {
    expect(COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(COOKIE_OPTIONS.sameSite).toBe("strict");
  });
});

describe("isAdminHost", () => {
  it("returns true for admin subdomain", () => {
    expect(isAdminHost("admin.example.com", "admin.")).toBe(true);
  });

  it("returns false for non-admin host", () => {
    expect(isAdminHost("example.com", "admin.")).toBe(false);
  });
});

describe("isProtectedRoute", () => {
  it("returns true for admin routes", () => {
    expect(isProtectedRoute("/admin/dashboard")).toBe(true);
  });

  it("returns false for login page", () => {
    expect(isProtectedRoute("/admin/login")).toBe(false);
  });

  it("returns false for non-admin routes", () => {
    expect(isProtectedRoute("/about")).toBe(false);
  });
});
