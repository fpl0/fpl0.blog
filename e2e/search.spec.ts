import { expect, test } from "@playwright/test";

const SEARCH_KEY = process.platform === "darwin" ? "Meta+k" : "Control+k";

test.describe("Search modal", () => {
  test("opens with keyboard shortcut and closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(SEARCH_KEY);
    await expect(page.locator("#search-backdrop")).toHaveClass(/is-open/);
    await page.keyboard.press("Escape");
    await expect(page.locator("#search-backdrop")).not.toHaveClass(/is-open/);
  });

  test("input accepts text when modal opens", async ({ page }) => {
    await page.goto("/");
    await page.locator("#site-nav-search").click();
    await expect(page.locator("#search-backdrop")).toHaveClass(/is-open/);
    // Verify input is interactive (focus auto-management varies in headless)
    const input = page.locator("#search-input");
    await input.fill("test");
    await expect(input).toHaveValue("test");
  });

  test("shows latest items when query is empty", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(SEARCH_KEY);
    await expect(page.locator(".search-result").first()).toBeVisible({
      timeout: 5000,
    });
  });

  test("typing filters results", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(SEARCH_KEY);
    // Wait for initial results to load
    await expect(page.locator(".search-result").first()).toBeVisible({
      timeout: 5000,
    });
    const initialCount = await page.locator(".search-result").count();
    // Type a query that should filter results
    await page.locator("#search-input").fill("zzz_no_match_expected");
    // Results should change (fewer or "no results" message)
    await expect(async () => {
      const newCount = await page.locator(".search-result").count();
      expect(newCount).not.toBe(initialCount);
    }).toPass({ timeout: 3000 });
  });

  test("arrow keys navigate results", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(SEARCH_KEY);
    await expect(page.locator(".search-result").first()).toBeVisible({
      timeout: 5000,
    });
    const first = page.locator('.search-result[data-index="0"]');
    await expect(first).toHaveClass(/is-selected|selected/);
    await page.keyboard.press("ArrowDown");
    const second = page.locator('.search-result[data-index="1"]');
    await expect(second).toHaveClass(/is-selected|selected/);
    await page.keyboard.press("ArrowUp");
    await expect(first).toHaveClass(/is-selected|selected/);
  });

  test("Enter navigates to selected result", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(SEARCH_KEY);
    await expect(page.locator(".search-result").first()).toBeVisible({
      timeout: 5000,
    });
    await page.keyboard.press("Enter");
    // Should navigate away from homepage
    await expect(page).not.toHaveURL("/");
  });

  test("clicking backdrop closes modal", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press(SEARCH_KEY);
    await expect(page.locator("#search-backdrop")).toHaveClass(/is-open/);
    await page.locator("#search-backdrop").click({
      position: { x: 5, y: 5 },
    });
    await expect(page.locator("#search-backdrop")).not.toHaveClass(/is-open/);
  });

  test("body scroll is disabled when modal is open", async ({ page }) => {
    await page.goto("/");
    const overflowBefore = await page.evaluate(() => document.body.style.overflow);
    expect(overflowBefore).not.toBe("hidden");
    await page.keyboard.press(SEARCH_KEY);
    await expect(page.locator("#search-backdrop")).toHaveClass(/is-open/);
    const overflowDuring = await page.evaluate(() => document.body.style.overflow);
    expect(overflowDuring).toBe("hidden");
    await page.keyboard.press("Escape");
    const overflowAfter = await page.evaluate(() => document.body.style.overflow);
    expect(overflowAfter).not.toBe("hidden");
  });
});
