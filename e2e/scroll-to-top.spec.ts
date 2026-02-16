import { expect, type Page, test } from "@playwright/test";

/** Navigate to the writing-guide blog post (long page for scroll testing). */
async function goToTestPost(page: Page): Promise<void> {
  await page.goto("/");
  const link = page.locator('.post-title[href="/blog/writing-guide/"]');
  await expect(link).toBeAttached();
  await page.goto("/blog/writing-guide/");
}

test.describe("Scroll to top", () => {
  test("button is hidden initially", async ({ page }) => {
    await goToTestPost(page);
    const btn = page.locator("#scroll-to-top");
    await expect(btn).toBeAttached();
    await expect(btn).not.toHaveClass(/is-visible/);
  });

  test("button appears after scrolling down", async ({ page }) => {
    await goToTestPost(page);
    await page.waitForLoadState("networkidle");
    // Scroll down past threshold using mouse wheel for real scroll events
    await page.mouse.wheel(0, 800);
    const btn = page.locator("#scroll-to-top");
    await expect(btn).toHaveClass(/is-visible/, { timeout: 5000 });
  });

  test("clicking button scrolls to top", async ({ page }) => {
    await goToTestPost(page);
    await page.waitForLoadState("networkidle");
    await page.mouse.wheel(0, 800);
    const btn = page.locator("#scroll-to-top");
    await expect(btn).toHaveClass(/is-visible/, { timeout: 5000 });
    await btn.click();
    await expect(async () => {
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeLessThan(10);
    }).toPass({ timeout: 3000 });
  });
});
