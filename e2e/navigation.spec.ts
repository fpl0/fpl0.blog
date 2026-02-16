import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test("header links navigate correctly", async ({ page }) => {
    await page.goto("/");
    await page.locator(".site-header a[href='/about']").click();
    await expect(page).toHaveURL("/about");
    await page.locator(".site-header a[href='/tags/']").click();
    await expect(page).toHaveURL("/tags/");
    await page.locator(".site-header-brand").click();
    await expect(page).toHaveURL("/");
  });

  test("view transitions preserve JS state across navigation", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as Record<string, boolean>).__e2eMarker = true;
    });
    await page.locator(".site-header a[href='/about']").click();
    await expect(page).toHaveURL("/about");
    const marker = await page.evaluate(
      () => (window as unknown as Record<string, boolean>).__e2eMarker,
    );
    expect(marker).toBe(true);
  });
});

test.describe("Tags", () => {
  test("tags index lists tags with counts", async ({ page }) => {
    await page.goto("/tags/");
    const tagLinks = page.locator("a[href^='/tags/']").filter({
      hasNotText: "tags",
    });
    expect(await tagLinks.count()).toBeGreaterThan(0);
  });

  test("tag archive shows filtered content", async ({ page }) => {
    await page.goto("/tags/");
    // Find a tag link (not the nav "tags" link itself)
    const links = page.locator("a[href^='/tags/']");
    const count = await links.count();
    let tagHref: string | null = null;
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      if (href && href !== "/tags/" && href !== "/tags") {
        tagHref = href;
        break;
      }
    }
    expect(tagHref).not.toBeNull();
    await page.goto(tagHref as string);
    await expect(page.locator(".post-item").first()).toBeVisible();
  });
});

test.describe("Static pages", () => {
  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("404 page shows for nonexistent routes", async ({ page }) => {
    const response = await page.goto("/nonexistent-page-12345/");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Feeds and data", () => {
  test("RSS feed returns valid XML", async ({ page }) => {
    const response = await page.goto("/rss.xml");
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"] ?? "";
    expect(contentType).toMatch(/xml/);
    const body = await response?.text();
    expect(body).toContain("<channel>");
  });

  test("sitemap was generated during build", async () => {
    const { existsSync } = await import("node:fs");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const testDir = dirname(fileURLToPath(import.meta.url));
    const sitemapPath = join(testDir, "..", "dist", "sitemap-index.xml");
    expect(existsSync(sitemapPath)).toBe(true);
  });

  test("search.json returns valid JSON array", async ({ request }) => {
    const response = await request.get("/search.json");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    const first = data[0];
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("slug");
  });
});
