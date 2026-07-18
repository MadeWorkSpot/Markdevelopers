import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

describe("getClientIp", () => {
  it("returns cf-connecting-ip header", () => {
    const request = new Request("http://localhost", {
      headers: { "cf-connecting-ip": "1.2.3.4" },
    });
    expect(getClientIp(request)).toBe("1.2.3.4");
  });

  it("falls back to x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "5.6.7.8, 9.10.11.12" },
    });
    expect(getClientIp(request)).toBe("5.6.7.8");
  });

  it("takes first IP from x-forwarded-for chain", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "10.0.0.1, 192.168.1.1, 172.16.0.1" },
    });
    expect(getClientIp(request)).toBe("10.0.0.1");
  });

  it("falls back to x-real-ip", () => {
    const request = new Request("http://localhost", {
      headers: { "x-real-ip": "11.12.13.14" },
    });
    expect(getClientIp(request)).toBe("11.12.13.14");
  });

  it("prefers cf-connecting-ip over x-forwarded-for", () => {
    const request = new Request("http://localhost", {
      headers: {
        "cf-connecting-ip": "1.1.1.1",
        "x-forwarded-for": "2.2.2.2",
      },
    });
    expect(getClientIp(request)).toBe("1.1.1.1");
  });

  it("returns empty string when no IP headers present", () => {
    const request = new Request("http://localhost");
    expect(getClientIp(request)).toBe("");
  });
});

describe("checkRateLimit (in-memory fallback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows request on first call", async () => {
    const result = await checkRateLimit("test-key-1");
    expect(result.allowed).toBe(true);
  });

  it("allows requests up to max attempts", async () => {
    const key = "test-key-2";
    for (let i = 0; i < 5; i++) {
      const result = await checkRateLimit(key);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks after max attempts exceeded", async () => {
    const key = "test-key-3";
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key);
    }
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("returns different retryAfterMs values within window", async () => {
    const key = "test-key-4";
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key);
    }
    const result1 = await checkRateLimit(key);
    expect(result1.allowed).toBe(false);

    // Advance time by 5 minutes
    vi.advanceTimersByTime(5 * 60 * 1000);
    const result2 = await checkRateLimit(key);
    expect(result2.allowed).toBe(false);
    expect(result2.retryAfterMs).toBeLessThan(result1.retryAfterMs!);
  });

  it("resets after window expires", async () => {
    const key = "test-key-5";
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(key);
    }
    const blocked = await checkRateLimit(key);
    expect(blocked.allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);
    const allowed = await checkRateLimit(key);
    expect(allowed.allowed).toBe(true);
  });

  it("tracks different keys independently", async () => {
    const keyA = "test-key-a";
    const keyB = "test-key-b";

    for (let i = 0; i < 5; i++) {
      await checkRateLimit(keyA);
    }

    const blockedA = await checkRateLimit(keyA);
    expect(blockedA.allowed).toBe(false);

    const allowedB = await checkRateLimit(keyB);
    expect(allowedB.allowed).toBe(true);
  });
});
