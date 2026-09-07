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

  test('shows friendly date format', async ({ page }) => {
    await page.goto('/posts/hello-world/');
    const timeElement = page.locator('.fm time').first();
    await expect(timeElement).toBeVisible();
    const dateText = await timeElement.textContent();
    expect(dateText).toMatch(/^\d{1,2} \w+ \d{4}$/);
  });

  test('post navigation appears when multiple posts exist, or is absent when only one', async ({ page }) => {
    await page.goto('/');
    const postCount = await page.locator('.posts li').count();
    
    await page.goto('/posts/hello-world/');
    const postNav = page.locator('.post-nav');
    
    if (postCount >= 2) {
      await expect(postNav).toBeVisible();
      const navLinks = postNav.locator('a');
      await expect(navLinks.first()).toBeVisible();
    } else {
      await expect(postNav).not.toBeVisible();
    }
  });
});

test.describe('About page', () => {
  test('loads successfully and shows Hello World', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Hello World');
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
  });

  test('defaults to dark and toggles dark ↔ light', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.locator('#theme-toggle');

    await page.evaluate(() => {
      localStorage.removeItem('theme');
    });
    await page.reload();

    expect(await html.getAttribute('data-theme')).toBe('dark');
    expect(await toggle.getAttribute('aria-label')).toBe('Use light theme');

    await toggle.click();
    expect(await html.getAttribute('data-theme')).toBe('light');
    expect(await toggle.getAttribute('aria-label')).toBe('Use dark theme');

    await toggle.click();
    expect(await html.getAttribute('data-theme')).toBe('dark');
    expect(await toggle.getAttribute('aria-label')).toBe('Use light theme');
  });

  test('aria-label shows next action only (no aria-pressed)', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('#theme-toggle');

    await expect(toggle).not.toHaveAttribute('aria-pressed');
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();

    expect(await toggle.getAttribute('aria-label')).toBe('Use light theme');
    await toggle.click();
    expect(await toggle.getAttribute('aria-label')).toBe('Use dark theme');
    await expect(toggle).not.toHaveAttribute('aria-pressed');
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

    expect(await html.getAttribute('data-theme')).toBe(themeAfterToggle);
    expect(await html.evaluate(el => el.style.colorScheme)).toBe(colorSchemeAfterToggle);
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

  test('index post titles are h2 headings', async ({ page }) => {
    await page.goto('/');
    const postTitles = page.locator('.posts li h2.title');
    await expect(postTitles.first()).toBeVisible();
    const count = await postTitles.count();
    expect(count).toBeGreaterThan(0);
  });
});
