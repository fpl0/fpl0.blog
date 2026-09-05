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
