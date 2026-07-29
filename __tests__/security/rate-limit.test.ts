import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

describe("checkRateLimit in memory mode", () => {

  it("allows requests within limit", async () => {
    const r1 = await checkRateLimit("test-key", "127.0.0.1", 5);
    expect(r1.allowed).toBe(true);
    const r2 = await checkRateLimit("test-key", "127.0.0.1", 5);
    expect(r2.allowed).toBe(true);
  });

  it("blocks requests exceeding limit", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("test-block", "10.0.0.1", 5);
    }
    const result = await checkRateLimit("test-block", "10.0.0.1", 5);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("different keys have separate counters", async () => {
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("key-a", "10.0.0.1", 5);
    }
    const result = await checkRateLimit("key-b", "10.0.0.1", 5);
    expect(result.allowed).toBe(true);
  });

  it("allows custom max attempts", async () => {
    await checkRateLimit("test-custom", "10.0.0.2", 1);
    const result = await checkRateLimit("test-custom", "10.0.0.2", 1);
    expect(result.allowed).toBe(false);
  });
});

describe("getClientIp", () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request("http://localhost", { headers: new Headers(headers) });
  }

  it("returns cf-connecting-ip when present", () => {
    const req = makeRequest({ "cf-connecting-ip": "1.2.3.4" });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-forwarded-for", () => {
    const req = makeRequest({
      "x-forwarded-for": "5.6.7.8, 9.10.11.12",
    });
    expect(getClientIp(req)).toBe("5.6.7.8");
  });

  it("falls back to x-real-ip", () => {
    const req = makeRequest({
      "x-real-ip": "13.14.15.16",
    });
    expect(getClientIp(req)).toBe("13.14.15.16");
  });
});
