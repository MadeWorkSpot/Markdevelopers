import { describe, it, expect } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

const FALLBACK = "/admin/dashboard";

describe("safeRedirectPath", () => {
  it("allows safe relative paths", () => {
    expect(safeRedirectPath("/admin/dashboard", FALLBACK)).toBe("/admin/dashboard");
    expect(safeRedirectPath("/admin/settings", FALLBACK)).toBe("/admin/settings");
  });

  it("allows relative paths with query strings", () => {
    expect(safeRedirectPath("/admin/dashboard?tab=recent", FALLBACK)).toBe(
      "/admin/dashboard?tab=recent"
    );
  });

  it("returns the fallback for null or empty input", () => {
    expect(safeRedirectPath(null, FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("", FALLBACK)).toBe(FALLBACK);
  });

  it("blocks absolute external URLs", () => {
    expect(safeRedirectPath("https://evil.com/phish", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("http://evil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("blocks protocol-relative URLs", () => {
    expect(safeRedirectPath("//evil.com/phish", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("///evil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("blocks backslash tricks and encoded slashes", () => {
    expect(safeRedirectPath("/\\evil.com", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/%2Fevil.com", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/%2fevil.com", FALLBACK)).toBe(FALLBACK);
  });

  it("blocks javascript: and other schemes", () => {
    expect(safeRedirectPath("javascript:alert(1)", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("data:text/html,x", FALLBACK)).toBe(FALLBACK);
  });

  it("blocks control characters", () => {
    expect(safeRedirectPath("/admin/dashboard\n", FALLBACK)).toBe(FALLBACK);
    expect(safeRedirectPath("/admin/dashboard\r", FALLBACK)).toBe(FALLBACK);
  });

  it("blocks over-long redirect targets", () => {
    expect(safeRedirectPath("/admin/" + "x".repeat(3000), FALLBACK)).toBe(FALLBACK);
  });

  it("blocks whitespace-padded absolute URLs", () => {
    expect(safeRedirectPath("  https://evil.com", FALLBACK)).toBe(FALLBACK);
  });
});
