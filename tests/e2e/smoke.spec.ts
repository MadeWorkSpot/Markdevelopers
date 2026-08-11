import { test, expect } from "@playwright/test";

test("homepage loads and displays title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Mark Developers/);
});

test("about page loads", async ({ page }) => {
  await page.goto("/about");
  await expect(page.locator("h1")).toBeVisible();
});

test("projects page loads", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator("h1")).toBeVisible();
});

test("gallery page loads", async ({ page }) => {
  await page.goto("/gallery");
  await expect(page.locator("h1")).toBeVisible();
});

test("homepage renders the contact form", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("form")).toBeVisible();
  await expect(page.getByRole("button", { name: /send|submit/i }).first()).toBeVisible();
});

test("unknown routes return a 404 not-found page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist-xyz");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1").first()).toBeVisible();
});

// ── Host routing ──────────────────────────────────────────────────────────────
// The middleware gates /admin behind the exact admin subdomain. Lookalike hosts
// must be treated as public (rewrite to /_not-found) and never serve admin UI.

test("public host cannot access /admin (rewritten to 404)", async ({ request }) => {
  const response = await request.get("/admin/dashboard", {
    headers: { Host: "localhost:3000" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(404);
});

test("public host cannot access the forgot-password flow (rewritten to 404)", async ({ request }) => {
  for (const path of ["/admin/forgot", "/admin/forgot/otp", "/admin/forgot/reset"]) {
    const response = await request.get(path, {
      headers: { Host: "localhost:3000" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(404);
  }
});

test("lookalike admin host cannot access /admin (rewritten to 404)", async ({ request }) => {
  const response = await request.get("/admin/dashboard", {
    headers: { Host: "admindashboard.evil.com" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(404);
});

test("admin host allows the forgot-password flow without a session", async ({ request }) => {
  for (const path of ["/admin/forgot", "/admin/forgot/otp", "/admin/forgot/reset"]) {
    const response = await request.get(path, {
      headers: { Host: "admin.localhost:3000" },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(200);
  }
});

test("admin host redirects unauthenticated admin path to login", async ({ request }) => {
  const response = await request.get("/admin/dashboard", {
    headers: { Host: "admin.localhost:3000" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(/\/admin\/login$/);
});

test("admin host redirects non-admin path to dashboard", async ({ request }) => {
  const response = await request.get("/", {
    headers: { Host: "admin.localhost:3000" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toMatch(/\/admin\/dashboard$/);
});
