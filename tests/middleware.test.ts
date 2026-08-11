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

    it("rewrites /admin/forgot flow to /_not-found on public host", () => {
      for (const path of ["/admin/forgot", "/admin/forgot/otp", "/admin/forgot/reset"]) {
        const req = createRequest(
          `http://markdev.com${path}`,
          "markdev.com"
        );
        const res = middleware(req);
        expect(res).toBeInstanceOf(NextResponse);
        const rewrittenUrl = res.headers.get("x-middleware-rewrite");
        expect(rewrittenUrl).toContain("/_not-found");
      }
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

    it("allows /admin/forgot flow without session", () => {
      for (const path of ["/admin/forgot", "/admin/forgot/otp", "/admin/forgot/reset"]) {
        const req = createRequest(
          `http://admin.markdev.com${path}`,
          "admin.markdev.com"
        );
        const res = middleware(req);
        expect(res).toBeInstanceOf(NextResponse);
        expect(res.status).toBe(200);
      }
    });

    it("redirects /admin/forgot to /admin/dashboard if session exists", () => {
      const req = createRequest(
        "http://admin.markdev.com/admin/forgot",
        "admin.markdev.com",
        { session: "some-session-token" }
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/admin/dashboard");
    });

    it("redirects /admin/forgot/otp to /admin/dashboard if session exists", () => {
      const req = createRequest(
        "http://admin.markdev.com/admin/forgot/otp",
        "admin.markdev.com",
        { session: "some-session-token" }
      );
      const res = middleware(req);
      expect(res).toBeInstanceOf(NextResponse);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/admin/dashboard");
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

  describe("staging admin host (explicit ADMIN_HOST)", () => {
    beforeEach(() => {
      vi.stubEnv("PUBLIC_HOST", "dev.markdevelopers.in");
      vi.stubEnv("ADMIN_HOST_PREFIX", "admin-dev.");
      vi.stubEnv("ADMIN_HOST", "admin-dev.markdevelopers.in");
    });

    it("recognizes admin-dev.markdevelopers.in as the admin host", () => {
      const req = createRequest(
        "http://admin-dev.markdevelopers.in/admin/login",
        "admin-dev.markdevelopers.in"
      );
      const res = middleware(req);
      expect(res.status).toBe(200);
    });

    it("redirects non-admin paths to /admin/dashboard on the admin host", () => {
      const req = createRequest(
        "http://admin-dev.markdevelopers.in/",
        "admin-dev.markdevelopers.in"
      );
      const res = middleware(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toContain("/admin/dashboard");
    });

    it("does not treat admin-dev.dev.markdevelopers.in as the admin host", () => {
      const req = createRequest(
        "http://admin-dev.dev.markdevelopers.in/admin/login",
        "admin-dev.dev.markdevelopers.in"
      );
      const res = middleware(req);
      const rewrittenUrl = res.headers.get("x-middleware-rewrite");
      expect(rewrittenUrl).toContain("/_not-found");
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
