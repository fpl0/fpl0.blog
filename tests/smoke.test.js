import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully and shows site title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/fpl0/);
    const masthead = page.locator('.masthead');
    await expect(masthead).toBeVisible();
  });

  test('shows post list', async ({ page }) => {
    await page.goto('/');
    const posts = page.locator('.posts li');
    await expect(posts).not.toHaveCount(0);
  });
});

test.describe('Blog post', () => {
  test('loads successfully with expected structure', async ({ page }) => {
    await page.goto('/posts/hello-world/');
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('.post-header h1')).toBeVisible();
    await expect(page.locator('.prose')).toBeVisible();
  });

  test('includes post metadata', async ({ page }) => {
    await page.goto('/posts/hello-world/');
    await expect(page.locator('.fm time')).toBeVisible();
  });
});

test.describe('404 page', () => {
  test('shows custom 404 for non-existent page', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response.status()).toBe(404);
  });
});

test.describe('RSS feed', () => {
  test('exists and is valid XML', async ({ page }) => {
    const response = await page.goto('/rss.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
    
    const body = await response.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<rss');
    expect(body).toContain('</rss>');
  });

  test('includes site metadata', async ({ page }) => {
    await page.goto('/rss.xml');
    const body = await page.content();
    expect(body).toContain('<title>');
    expect(body).toContain('<link>');
  });
});

test.describe('Theme toggle', () => {
  test('button exists and is accessible', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-label', /theme/i);
    await expect(toggle).toHaveAttribute('aria-pressed');
  });

  test('actually flips theme by changing data-theme and colorScheme', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.locator('#theme-toggle');
    
    const initialTheme = await html.getAttribute('data-theme');
    const initialColorScheme = await html.evaluate(el => el.style.colorScheme);
    const initialPressed = await toggle.getAttribute('aria-pressed');
    const initialLabel = await toggle.getAttribute('aria-label');
    
    await toggle.click();
    
    const newTheme = await html.getAttribute('data-theme');
    const newColorScheme = await html.evaluate(el => el.style.colorScheme);
    const newPressed = await toggle.getAttribute('aria-pressed');
    const newLabel = await toggle.getAttribute('aria-label');
    
    expect(newTheme).not.toBe(initialTheme);
    expect(newTheme).toMatch(/^(light|dark)$/);
    expect(newColorScheme).not.toBe(initialColorScheme);
    expect(newColorScheme).toMatch(/^(light|dark)$/);
    expect(newPressed).not.toBe(initialPressed);
    expect(newLabel).not.toBe(initialLabel);
  });

  test('persists theme preference across page reload via localStorage', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.locator('#theme-toggle');
    
    await toggle.click();
    const themeAfterToggle = await html.getAttribute('data-theme');
    const colorSchemeAfterToggle = await html.evaluate(el => el.style.colorScheme);
    const localStorageTheme = await page.evaluate(() => localStorage.getItem('theme'));
    
    expect(localStorageTheme).toBe(themeAfterToggle);
    expect(themeAfterToggle).toMatch(/^(light|dark)$/);
    
    await page.reload();
    
    const themeAfterReload = await html.getAttribute('data-theme');
    const colorSchemeAfterReload = await html.evaluate(el => el.style.colorScheme);
    
    expect(themeAfterReload).toBe(themeAfterToggle);
    expect(colorSchemeAfterReload).toBe(colorSchemeAfterToggle);
  });
});

test.describe('Draft exclusion', () => {
  test('draft posts do not appear on homepage post list', async ({ page }) => {
    await page.goto('/');
    const posts = page.locator('.posts li');
    const postsText = await posts.allTextContents();
    const combinedText = postsText.join(' ').toLowerCase();
    
    expect(combinedText).not.toContain('returning to java');
    expect(combinedText).not.toContain('java swing');
  });
});

test.describe('Accessibility', () => {
  test('skip link focuses main content', async ({ page }) => {
    await page.goto('/');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    const focusedElement = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElement).toBe('main');
  });

  test('RSS link is reachable in navigation', async ({ page }) => {
    await page.goto('/');
    const rssLink = page.locator('nav a[href="/rss.xml"]');
    await expect(rssLink).toBeVisible();
    await expect(rssLink).toHaveText('rss');
  });
});
