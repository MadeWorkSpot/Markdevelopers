import { describe, it, expect } from "vitest";
import {
  SESSION_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  COOKIE_OPTIONS,
  isAdminHost,
  isProtectedRoute,
  shouldUseSecureCookies,
  getCookieOptions,
  isAdminEmail,
  getAllowedAdminEmails,
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
  const env = {
    PUBLIC_HOST: "example.com",
    ADMIN_HOST_PREFIX: "admin.",
  };

  it("returns true for the configured admin subdomain", () => {
    expect(isAdminHost("admin.example.com", env)).toBe(true);
  });

  it("returns false for non-admin host", () => {
    expect(isAdminHost("example.com", env)).toBe(false);
  });

  it("rejects lookalike hosts that merely start with the prefix", () => {
    expect(isAdminHost("admindashboard.example.com", env)).toBe(false);
    expect(isAdminHost("admin.example.com.evil.com", env)).toBe(false);
    expect(isAdminHost("admin.example.com:3000", env)).toBe(true);
  });

  it("rejects empty hosts", () => {
    expect(isAdminHost("", env)).toBe(false);
  });
});

describe("shouldUseSecureCookies", () => {
  it("returns false in development", () => {
    expect(shouldUseSecureCookies({ NODE_ENV: "development" })).toBe(false);
  });

  it("returns false in production when ENVIRONMENT=local (local override)", () => {
    expect(
      shouldUseSecureCookies({ NODE_ENV: "production", ENVIRONMENT: "local" })
    ).toBe(false);
  });

  it("returns true in production otherwise", () => {
    expect(
      shouldUseSecureCookies({ NODE_ENV: "production", ENVIRONMENT: "production" })
    ).toBe(true);
  });

  it("fails closed (true) when the environment is ambiguous", () => {
    expect(shouldUseSecureCookies({})).toBe(true);
  });

  it("getCookieOptions sets httpOnly, secure, sameSite strict and path", () => {
    const opts = getCookieOptions({ NODE_ENV: "production", ENVIRONMENT: "production" });
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("strict");
    expect(opts.path).toBe("/");
  });
});

describe("admin allowlist", () => {
  it("parses comma-separated emails", () => {
    expect(
      Array.from(getAllowedAdminEmails({ ALLOWED_ADMIN_EMAILS: "a@x.com, b@x.com, c@x.com" }))
    ).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("returns empty set when unset (fail closed)", () => {
    expect(getAllowedAdminEmails({}).size).toBe(0);
  });

  it("isAdminEmail matches an allowlisted email", () => {
    expect(isAdminEmail("a@x.com", { ALLOWED_ADMIN_EMAILS: "a@x.com" })).toBe(true);
  });

  it("isAdminEmail rejects emails not on the allowlist", () => {
    expect(isAdminEmail("z@x.com", { ALLOWED_ADMIN_EMAILS: "a@x.com" })).toBe(false);
  });

  it("isAdminEmail rejects everything when unconfigured", () => {
    expect(isAdminEmail("a@x.com", {})).toBe(false);
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
