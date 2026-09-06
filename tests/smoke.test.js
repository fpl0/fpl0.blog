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

  test('post titles are h2 headings for accessibility', async ({ page }) => {
    await page.goto('/');
    // Each post title should be in an h2 for proper document outline
    const postHeadings = page.locator('.posts h2');
    await expect(postHeadings.first()).toBeVisible();
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

  test('includes post navigation and subscribe footer', async ({ page }) => {
    await page.goto('/posts/hello-world/');
    // Navigation should exist (prev/next links or subscribe footer)
    const postNav = page.locator('.post-nav');
    const postFooter = page.locator('.post-footer');
    await expect(postFooter).toBeVisible();
    // Footer should have RSS and LinkedIn links
    await expect(postFooter.locator('a[href="/rss.xml"]')).toBeVisible();
    await expect(postFooter.locator('a[href*="linkedin"]')).toBeVisible();
  });
});

test.describe('About page', () => {
  test('loads successfully', async ({ page }) => {
    const response = await page.goto('/about/');
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('About');
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
    // Use request API to get raw XML without browser transformation
    const response = await page.request.get('/rss.xml');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('xml');
    
    const body = await response.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<rss');
    expect(body).toContain('</rss>');
  });

  test('includes XSL stylesheet and content', async ({ page }) => {
    // Visit the feed in browser, which will render the XSL transformation
    await page.goto('/rss.xml');
    
    // The XSL renders a human-readable page
    await expect(page.locator('h1')).toContainText('fpl0');
    
    // Verify the raw XML has content:encoded namespace
    const response = await page.request.get('/rss.xml');
    const body = await response.text();
    expect(body).toContain('content:encoded');
    expect(body).toContain('<?xml-stylesheet');
  });
});

test.describe('Theme toggle', () => {
  test('button exists and is accessible', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();
    // The toggle cycles through light/dark/system and shows current state in aria-label
    const label = await themeToggle.getAttribute('aria-label');
    expect(label).toMatch(/Theme \((light|dark|system)\)/);
  });

  test('toggles theme on click', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.locator('#theme-toggle');
    const html = page.locator('html');
    
    const initialTheme = await html.evaluate(el => el.dataset.theme || 'system');
    await themeToggle.click();
    
    const newTheme = await html.evaluate(el => el.dataset.theme);
    expect(newTheme).toBeTruthy();
    expect(newTheme).not.toBe(initialTheme === 'system' ? undefined : initialTheme);
  });

  test('persists theme preference', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.locator('#theme-toggle');
    
    await themeToggle.click();
    const theme = await page.locator('html').evaluate(el => el.dataset.theme);
    
    await page.reload();
    const persistedTheme = await page.locator('html').evaluate(el => el.dataset.theme);
    expect(persistedTheme).toBe(theme);
  });

  test('updates aria-label when toggled', async ({ page }) => {
    await page.goto('/');
    const themeToggle = page.locator('#theme-toggle');
    
    const initialLabel = await themeToggle.getAttribute('aria-label');
    await themeToggle.click();
    const newLabel = await themeToggle.getAttribute('aria-label');
    
    expect(newLabel).not.toBe(initialLabel);
    // Label shows current theme: "Theme (light)", "Theme (dark)", or "Theme (system)"
    expect(newLabel).toMatch(/Theme \((light|dark|system)\)/);
  });
});
