import { expect, test } from "@playwright/test";

test.describe("Theme toggle", () => {
  test("toggle button exists with aria-label", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator("#theme-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-label", /theme/i);
  });

  test("clicking toggles data-theme between dark and light", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");
    const expectedTheme = initialTheme === "dark" ? "light" : "dark";
    await page.locator("#theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", expectedTheme);
    // Toggle back
    await page.locator("#theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", initialTheme as string);
  });

  test("theme persists across navigation", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");
    const newTheme = initialTheme === "dark" ? "light" : "dark";
    // Toggle to new theme
    await page.locator("#theme-toggle").click();
    await expect(html).toHaveAttribute("data-theme", newTheme);
    // Navigate to another page
    await page.locator("a[href='/about']").click();
    await expect(page).toHaveURL("/about");
    // Theme should persist
    await expect(html).toHaveAttribute("data-theme", newTheme);
  });

  test("localStorage stores theme preference", async ({ page }) => {
    await page.goto("/");
    const initialTheme = await page.locator("html").getAttribute("data-theme");
    const newTheme = initialTheme === "dark" ? "light" : "dark";
    await page.locator("#theme-toggle").click();
    const stored = await page.evaluate(() => localStorage.getItem("theme"));
    expect(stored).toBe(newTheme);
  });
});
