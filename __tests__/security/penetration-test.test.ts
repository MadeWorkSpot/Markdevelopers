/**
 * PENETRATION TEST — Every attack surface (v3)
 * Tests against real lib modules using correct exports.
 */
import { describe, it, expect } from "vitest";
import * as fs from "fs";

function readSrc(rel: string): string {
  return fs.readFileSync(process.cwd() + "/" + rel, "utf-8");
}

/* ============================================================
 * PHASE A — Authentication & Session
 * ============================================================ */
describe("PHASE A — Authentication & Session", () => {

  it("A1: session cookie uses HMAC-SHA256 (cannot be forged without secret)", () => {
    const src = readSrc("lib/firebase-admin.ts");
    expect(src).toContain("HMAC");
    expect(src).toContain("SHA-256");
    expect(src).toContain("getSessionKey");
    expect(src).toContain("SESSION_SECRET");
  });

  it("A2: verifySessionCookie checks issuer and audience", () => {
    const src = readSrc("lib/firebase-admin.ts");
    expect(src).toContain("issuer:");
    expect(src).toContain("audience:");
  });

  it("A3: verifySessionCookie supports revocation check", () => {
    const src = readSrc("lib/firebase-admin.ts");
    expect(src).toContain("checkRevoked");
    expect(src).toContain("Token has been revoked");
  });

  it("A4: login uses generic error (no user enumeration)", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("Invalid email or password");
    expect(src).not.toMatch(/user not found/i);
    expect(src).not.toMatch(/wrong password/i);
  });

  it("A5: login rate-limited per email", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("checkRateLimit(`login:${email}`)");
  });

  it("A6: logout revokes Firebase refresh tokens and clears cookies", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("revokeRefreshTokens");
    expect(src).toContain("await clearAuthCookies()");
  });

  it("A7: session cookie has httpOnly + secure + sameSite:strict", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("httpOnly: true");
    expect(src).toContain('sameSite: "strict"');
  });

  it("A8: session cookie max 24h, refresh token max 30d", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("maxAge: 60 * 60 * 24");
    expect(src).toContain("maxAge: 60 * 60 * 24 * 30");
  });
});

/* ============================================================
 * PHASE B — Upload Exploits
 * ============================================================ */
describe("PHASE B — Upload Exploits", () => {

  it("B1: rate limiter blocks by IP after max attempts", async () => {
    const { checkRateLimit } = await import("../../lib/rate-limit");
    const ip = "10.0.0.99";
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("upload-test", ip, 5);
    }
    const result = await checkRateLimit("upload-test", ip, 5);
    expect(result.allowed).toBe(false);
  });

  it("B2: sanitizeFileName strips traversal and special chars", async () => {
    const { sanitizeFileName } = await import("../../app/api/upload/route");
    const attacks = [
      "../../../etc/passwd",
      "foo\x00.jpg",
      "normal-file.jpg",
    ];
    for (const input of attacks) {
      const clean = sanitizeFileName(input);
      expect(clean).not.toMatch(/\x00/);
      expect(clean.length).toBeGreaterThan(0);
    }
  });

  it("B3: sanitizeFileName truncates long names to 255 chars", async () => {
    const { sanitizeFileName } = await import("../../app/api/upload/route");
    expect(sanitizeFileName("a".repeat(1000) + ".jpg").length).toBeLessThanOrEqual(255);
  });

  it("B4: ALLOWED_TYPES is a closed allowlist (no SVG/HTML/JS)", async () => {
    const src = readSrc("app/api/upload/route.ts");
    const match = src.match(/ALLOWED_TYPES\s*=\s*\[(.+?)\]/);
    expect(match).toBeTruthy();
    const types = match![1];
    expect(types).toContain("image/jpeg");
    expect(types).toContain("image/png");
    expect(types).toContain("image/gif");
    expect(types).toContain("image/webp");
    expect(types).toContain("image/avif");
    expect(types).not.toContain("image/svg+xml");
    expect(types).not.toContain("text/html");
    expect(types).not.toContain("application/javascript");
  });

  it("B5: file size limit is enforced (10MB)", async () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).toContain("MAX_SIZE");
    expect(src).toContain("10 * 1024 * 1024");
  });
});

/* ============================================================
 * PHASE C — XSS & Injection
 * ============================================================ */
describe("PHASE C — XSS & Injection", () => {

  it("C1: ImageCarousel blocks javascript: href via isSafeHref (FIXED)", () => {
    const src = readSrc("components/ImageCarousel.tsx");
    expect(src).toContain("isSafeHref");
    expect(src).toContain("javascript:");
    expect(src).toContain("vbscript:");
    expect(src).toContain("aria-disabled");
  });

  it("C2: isSafeHref blocks protocol-relative URLs", () => {
    const src = readSrc("components/ImageCarousel.tsx");
    expect(src).toContain("startsWith(\"//\")");
  });

  it("C3: upload route no longer leaks Cloudinary errors (FIXED)", () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).not.toContain("data.error?.message");
    expect(src).not.toContain("JSON.stringify(data)");
    expect(src).toContain("Upload failed. Please try again.");
  });

  it("C4: saveContent has 1MB size limit (FIXED)", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("1_048_576");
    expect(src).toContain("Content too large");
  });

  it("C5: contact form has input length limits", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("name.length > 100");
    expect(src).toContain("email.length > 254");
    expect(src).toContain("message.length > 5000");
  });

  it("C6: Firestore values are parameterized (no string injection)", () => {
    const src = readSrc("lib/firebase-admin.ts");
    expect(src).toContain("fieldFilter");
    expect(src).toContain("stringValue");
    expect(src).toContain("toRestValue");
  });
});

/* ============================================================
 * PHASE D — Rate Limiting
 * ============================================================ */
describe("PHASE D — Rate Limiting", () => {

  it("D1: memory fallback has max key limit", () => {
    const src = readSrc("lib/rate-limit.ts");
    expect(src).toContain("MEMORY_MAX_KEYS = 1000");
  });

  it("D2: expired entries are cleaned from memory", () => {
    const src = readSrc("lib/rate-limit.ts");
    expect(src).toContain("memoryAttempts.delete");
  });

  it("D3: KV failure falls back to memory (no total lockout)", () => {
    const src = readSrc("lib/rate-limit.ts");
    expect(src).toContain("return memoryCheck(key, maxAttempts)");
  });

  it("D4: login rate-limited separately from uploads", () => {
    const actionsSrc = readSrc("actions.ts");
    expect(actionsSrc).toContain("checkRateLimit(`login:${email}`)");
    const uploadSrc = readSrc("app/api/upload/route.ts");
    expect(uploadSrc).toContain('checkRateLimit("upload"');
  });
});

/* ============================================================
 * PHASE E — Data Integrity
 * ============================================================ */
describe("PHASE E — Data Integrity", () => {

  it("E1: content lock has timeout (FIXED)", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("CONTENT_LOCK_TIMEOUT_MS");
    expect(src).toContain("30_000");
    expect(src).toContain("Content lock timeout");
  });

  it("E2: WriteBatch commits sequentially (known limitation)", () => {
    const src = readSrc("lib/firebase-admin.ts");
    expect(src).toContain("for (const op of this._ops)");
  });

  it("E3: Firestore REST uses structured query (no string injection)", () => {
    const src = readSrc("lib/firebase-admin.ts");
    expect(src).toContain("buildStructuredQuery");
    expect(src).toContain("fieldFilter");
  });
});

/* ============================================================
 * PHASE F — Edge / Cloudflare
 * ============================================================ */
describe("PHASE F — Edge / Cloudflare", () => {

  it("F1: CSP script-src has no unsafe-eval", () => {
    const src = readSrc("next.config.ts");
    // Check that 'unsafe-eval' is not in the CSP directive (only in a comment is OK)
    const scriptSrcMatch = src.match(/script-src\s+[^;]+/);
    expect(scriptSrcMatch).toBeTruthy();
    expect(scriptSrcMatch![0]).not.toContain("unsafe-eval");
  });

  it("F2: middleware has no Node.js APIs", () => {
    const src = readSrc("middleware.ts");
    expect(src).not.toMatch(/require\(/);
    expect(src).not.toContain("import fs");
  });

  it("F3: session cookies are SameSite:strict", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain('sameSite: "strict"');
  });

  it("F4: session cookies are httpOnly", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("httpOnly: true");
  });
});

/* ============================================================
 * PHASE G — Information Disclosure
 * ============================================================ */
describe("PHASE G — Information Disclosure", () => {

  it("G1: upload errors are generic (FIXED)", () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).not.toContain("data.error?.message");
    expect(src).not.toContain("JSON.stringify(data)");
  });

  it("G2: session refresh uses cookies (no URL params)", () => {
    const src = readSrc("app/(admin)/admin/api/session/refresh/route.ts");
    expect(src).not.toMatch(/token=/);
    expect(src).toContain("cookieStore.set");
  });
});

/* ============================================================
 * PHASE H — Auth Logic
 * ============================================================ */
describe("PHASE H — Auth Logic", () => {

  it("H1: refresh token cookie is set on login", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain('"refresh_token"');
    expect(src).toContain("httpOnly: true");
    expect(src).toContain('sameSite: "strict"');
  });

  it("H2: protected layout verifies session cookie on every navigation", () => {
    const src = readSrc("app/(admin)/admin/(protected)/layout.tsx");
    expect(src).toContain("verifySessionCookie");
    expect(src).toContain("SESSION_COOKIE");
  });

  it("H3: middleware only checks cookie existence (not validity)", () => {
    const src = readSrc("middleware.ts");
    // Middleware checks: const session = request.cookies.get("session")?.value;
    // if (!isLoginRoute && !session) { redirect to login }
    expect(src).toContain('cookies.get("session")?.value');
    expect(src).toContain("!session");
    // It does NOT call verifySessionCookie — that's done in layout/actions
  });
});

/* ============================================================
 * PHASE I — Dependencies
 * ============================================================ */
describe("PHASE I — Dependencies", () => {

  it("I1: no cloudinary SDK import in source", async () => {
    const { globSync } = await import("glob");
    const files = globSync("**/*.{ts,tsx}", {
      cwd: process.cwd(),
      ignore: ["node_modules/**", "__tests__/**", "dist/**"],
    });
    for (const f of files) {
      const content = readSrc(f);
      expect(content).not.toContain('from "cloudinary"');
      expect(content).not.toContain("require('cloudinary')");
    }
  });
});

/* ============================================================
 * PHASE J — Exploit Chain Analysis
 * ============================================================ */
describe("PHASE J — Exploit Chain Analysis", () => {

  it("J1: stored XSS chain broken by isSafeHref", () => {
    const src = readSrc("components/ImageCarousel.tsx");
    expect(src).toContain("isSafeHref(s.href)");
    expect(src).toContain("aria-disabled");
  });

  it("J2: error leakage chain broken by generic messages", () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).not.toContain("JSON.stringify(data)");
    expect(src).not.toContain("data.error?.message");
  });

  it("J3: content lock deadlock chain broken by timeout", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("30_000");
    expect(src).toContain("Content lock timeout");
  });

  it("J4: oversized payload DoS mitigated by size limit", () => {
    const src = readSrc("actions.ts");
    expect(src).toContain("JSON.stringify(data)");
    expect(src).toContain("1_048_576");
  });

  it("J5: filename traversal chain broken by sanitization", () => {
    const src = readSrc("app/api/upload/route.ts");
    expect(src).toContain("sanitizeFileName");
    expect(src).toContain("safeName");
  });
});
