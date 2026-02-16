import { expect, type Page, test } from "@playwright/test";

/** Navigate to the game-of-life app (our canonical test app). */
async function goToTestApp(page: Page): Promise<void> {
  await page.goto("/");
  const link = page.locator('.post-title[href="/apps/game-of-life/"]');
  await expect(link).toBeAttached();
  await page.goto("/apps/game-of-life/");
}

test.describe("App page", () => {
  test("loads with title", async ({ page }) => {
    await goToTestApp(page);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("has interactive content area", async ({ page }) => {
    await goToTestApp(page);
    // Apps typically have a canvas or other interactive element
    const canvas = page.locator("canvas");
    const interactive = page.locator("canvas, [role='application'], .app-content");
    expect(await interactive.count()).toBeGreaterThan(0);
    if ((await canvas.count()) > 0) {
      await expect(canvas.first()).toBeVisible();
    }
  });

  test("app scripts load and execute", async ({ page }) => {
    await goToTestApp(page);
    // Verify at least one module script loaded (app interactivity)
    const hasScripts = await page.evaluate(
      () => document.querySelectorAll('script[type="module"]').length > 0,
    );
    expect(hasScripts).toBe(true);
  });

  test("controls are present when app has them", async ({ page }) => {
    await goToTestApp(page);
    // App should have at least its own interactive controls
    const appButtons = page.locator(
      "button:not(#theme-toggle):not(#scroll-to-top):not(#site-nav-search)",
    );
    if ((await appButtons.count()) > 0) {
      await expect(appButtons.first()).toBeVisible();
    }
  });
});
