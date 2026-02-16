import { expect, type Page, test } from "@playwright/test";

/** Navigate to the writing-guide blog post (our canonical test post). */
async function goToTestPost(page: Page): Promise<void> {
  await page.goto("/");
  const link = page.locator('.post-title[href="/blog/writing-guide/"]');
  await expect(link).toBeAttached();
  await page.goto("/blog/writing-guide/");
}

test.describe("Blog post page", () => {
  test("renders title as h1", async ({ page }) => {
    await goToTestPost(page);
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test("displays reading time", async ({ page }) => {
    await goToTestPost(page);
    await expect(page.locator(".date-time")).toContainText("min read");
  });

  test("shows tags with links", async ({ page }) => {
    await goToTestPost(page);
    const tags = page.locator(".post-header .post-tags");
    await expect(tags).toBeVisible();
    expect(await tags.locator("a").count()).toBeGreaterThan(0);
  });

  test("displays publication date", async ({ page }) => {
    await goToTestPost(page);
    await expect(page.locator(".date-time")).toContainText(/20\d{2}/);
  });

  test("content area is rendered", async ({ page }) => {
    await goToTestPost(page);
    const content = page.locator(".content");
    await expect(content).toBeVisible();
    const elements = content.locator("h2, h3, p");
    expect(await elements.count()).toBeGreaterThan(0);
  });

  test("table of contents exists when post has headings", async ({ page }) => {
    await goToTestPost(page);
    const toc = page.locator(".toc-sidebar");
    if ((await toc.count()) > 0) {
      const links = toc.locator(".toc-link");
      expect(await links.count()).toBeGreaterThan(0);
    }
  });

  test("syntax-highlighted code blocks render", async ({ page }) => {
    await goToTestPost(page);
    const codeBlocks = page.locator(".astro-code");
    if ((await codeBlocks.count()) > 0) {
      await expect(codeBlocks.first().locator("span").first()).toBeAttached();
    }
  });

  test("code copy buttons are injected", async ({ page }) => {
    await goToTestPost(page);
    const codeBlocks = page.locator(".astro-code");
    if ((await codeBlocks.count()) > 0) {
      const copyButtons = page.locator(".code-copy");
      await expect(copyButtons.first()).toBeAttached({ timeout: 3000 });
    }
  });

  test("mermaid diagrams render with light and dark SVGs", async ({ page }) => {
    await goToTestPost(page);
    const containers = page.locator(".mermaid-container");
    if ((await containers.count()) > 0) {
      const first = containers.first();
      await expect(first.locator(".mermaid-light svg")).toBeAttached();
      await expect(first.locator(".mermaid-dark svg")).toBeAttached();
    }
  });

  test("mermaid source toggle shows source", async ({ page }) => {
    await goToTestPost(page);
    const toggle = page.locator(".mermaid-toggle").first();
    if ((await toggle.count()) > 0) {
      await toggle.click();
      const container = page.locator(".mermaid-container").first();
      await expect(container.locator("pre")).toBeVisible();
    }
  });

  test("figures have captions", async ({ page }) => {
    await goToTestPost(page);
    const figures = page.locator("figure");
    if ((await figures.count()) > 0) {
      await expect(figures.first().locator("figcaption")).toBeVisible();
    }
  });

  test("tables have scrollable wrapper", async ({ page }) => {
    await goToTestPost(page);
    const wrappers = page.locator(".table-wrapper");
    if ((await wrappers.count()) > 0) {
      await expect(wrappers.first()).toBeVisible();
    }
  });

  test("collapsible details/summary elements toggle", async ({ page }) => {
    await goToTestPost(page);
    const details = page.locator("details").first();
    if ((await details.count()) > 0) {
      const summary = details.locator("summary");
      await expect(details).not.toHaveAttribute("open", "");
      await summary.click();
      await expect(details).toHaveAttribute("open", "");
    }
  });

  test("footnote references and section are rendered", async ({ page }) => {
    await goToTestPost(page);
    const refs = page.locator("a[data-footnote-ref]");
    if ((await refs.count()) > 0) {
      await expect(page.locator("[data-footnotes]")).toBeAttached();
    }
  });

  test("headings have IDs for anchor linking", async ({ page }) => {
    await goToTestPost(page);
    const headings = page.locator(".content h2[id]");
    expect(await headings.count()).toBeGreaterThan(0);
  });

  test("back link navigates to home", async ({ page }) => {
    await goToTestPost(page);
    const backLink = page.locator(".post-home-link");
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL("/");
  });
});
