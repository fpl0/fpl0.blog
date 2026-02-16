import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads with title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/fpl0/);
  });

  test("feed shows published content", async ({ page }) => {
    await page.goto("/");
    const postList = page.locator(".post-list");
    await expect(postList).toBeVisible();
    const items = postList.locator(".post-item");
    expect(await items.count()).toBeGreaterThan(0);
  });

  test("entry cards have title, date, summary, tags", async ({ page }) => {
    await page.goto("/");
    const entry = page.locator(".post-item").first();
    await expect(entry.locator(".post-date")).toBeVisible();
    await expect(entry.locator(".post-title")).toBeVisible();
    await expect(entry.locator(".post-summary")).toBeVisible();
    await expect(entry.locator(".post-tags")).toBeVisible();
  });

  test("app entries have app badge", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".app-tag").first()).toBeVisible();
  });

  test("header navigation is present", async ({ page }) => {
    await page.goto("/");
    const header = page.locator(".site-header");
    await expect(header).toBeVisible();
    await expect(header.locator("a[href='/about']")).toBeVisible();
    await expect(header.locator("a[href='/tags/']")).toBeVisible();
    await expect(header.locator("#site-nav-search")).toBeVisible();
  });

  test("explorer animation canvas is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("canvas")).toBeVisible();
  });

  test("empty state is not shown when feed has content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".empty-state")).not.toBeVisible();
  });
});
