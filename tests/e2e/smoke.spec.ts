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
