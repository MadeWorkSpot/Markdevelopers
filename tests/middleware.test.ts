import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "@/middleware";

function createRequest(
  url: string,
  host: string,
  cookies?: Record<string, string>
) {
  const req = new NextRequest(new URL(url), {
    headers: { host },
  });
  if (cookies) {
    for (const [name, value] of Object.entries(cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

describe("middleware", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("ADMIN_HOST_PREFIX", "admin.");
    vi.stubEnv("PUBLIC_HOST", "markdev.com");
  });

  describe("public site (non-admin host)", () => {
    it("passes through normal pages", () => {
      const req = createRequest("http://markdev.com/about", "markdev.com");
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      // NextResponse.next() has status 200
      expect(res.status).toBe(200);
    });

    it("passes through projects page", () => {
      const req = createRequest("http://markdev.com/projects", "markdev.com");
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(200);
    });

    it("rewrites /admin to /_not-found on public host", () => {
      const req = createRequest("http://markdev.com/admin", "markdev.com");
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      // Rewrite response has status 200 and x-middleware header
      const rewrittenUrl = res.headers.get("x-middleware-rewrite");
      expect(rewrittenUrl).toContain("/_not-found");
    });

    it("rewrites /admin/dashboard to /_not-found on public host", () => {
      const req = createRequest(
        "http://markdev.com/admin/dashboard",
        "markdev.com"
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      const rewrittenUrl = res.headers.get("x-middleware-rewrite");
      expect(rewrittenUrl).toContain("/_not-found");
    });
  });

  describe("admin host", () => {
    it("redirects non-admin paths to /admin/dashboard", () => {
      const req = createRequest(
        "http://admin.markdev.com/about",
        "admin.markdev.com"
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/admin/dashboard");
    });

    it("allows /admin/login without session", () => {
      const req = createRequest(
        "http://admin.markdev.com/admin/login",
        "admin.markdev.com"
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(200);
    });

    it("redirects /admin/login to /admin/dashboard if session exists", () => {
      const req = createRequest(
        "http://admin.markdev.com/admin/login",
        "admin.markdev.com",
        { session: "some-session-token" }
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/admin/dashboard");
    });

    it("redirects unauthenticated user to /admin/login", () => {
      const req = createRequest(
        "http://admin.markdev.com/admin/dashboard",
        "admin.markdev.com"
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/admin/login");
    });

    it("allows authenticated user through /admin/dashboard", () => {
      const req = createRequest(
        "http://admin.markdev.com/admin/dashboard",
        "admin.markdev.com",
        { session: "valid-session" }
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(200);
    });
  });

  describe("host parsing", () => {
    it("strips port from host header", () => {
      const req = createRequest(
        "http://markdev.com/about",
        "markdev.com:3000"
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(200);
    });

    it("detects admin prefix with port", () => {
      const req = createRequest(
        "http://admin.markdev.com:3000/admin/login",
        "admin.markdev.com:3000"
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(200);
    });
  });
});
