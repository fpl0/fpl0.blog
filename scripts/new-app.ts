/**
 * Scaffold a new app.
 *
 * Usage:
 *   bun run 0:new-app
 *
 * Creates:
 *   - src/content/apps/<slug>/index.md
 *   - src/content/apps/<slug>/App.astro
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { APPS_DIR, ask, nowISO, toSlug } from "./base";
import { printHelp, wantsHelp } from "./cli";
import { SUMMARY_MAX, SUMMARY_MIN } from "./constants";
import { error, heading, info, success, warn } from "./fmt";

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

if (wantsHelp()) {
  printHelp({
    command: "0:new-app",
    summary: "Scaffold a new app",
    usage: "bun run 0:new-app",
    examples: ["bun run 0:new-app"],
  });
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function indexMd(title: string, summary: string, tags: string[], date: string): string {
  const tagList = tags.length > 0 ? `[${tags.map((t) => `"${t}"`).join(", ")}]` : "[]";
  return `---
title: "${title}"
summary: "${summary}"
createdDate: "${date}"
isDraft: true
tags: ${tagList}
---
`;
}

function appAstro(slug: string): string {
  return `---
/**
 * ${slug} -- App Component
 *
 * Self-contained UI and all client-side logic.
 * Auto-discovered by the dynamic route at src/pages/apps/[slug].astro.
 */
---

<div class="${slug}-root" id="${slug}-root">
  <p class="${slug}-placeholder">App goes here.</p>
</div>

<style>
  .${slug}-root {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: var(--color-text);
  }

  .${slug}-placeholder {
    font-family: var(--font-serif);
    font-size: var(--font-size-h3);
    color: var(--color-text-muted);
  }
</style>

<script>
  import { onPageReady } from "../../../utils/lifecycle";

  onPageReady((signal) => {
    const root = document.getElementById("${slug}-root");
    if (!root) return;

    // Handle theme changes — redraw when theme toggles
    const themeObserver = new MutationObserver(() => {
      // Re-render if needed
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    signal.addEventListener("abort", () => themeObserver.disconnect());
  });
${"</"}script>
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

heading("New App");

const title = ask("Title:");
if (!title) {
  error("Title is required.");
  process.exit(1);
}

const defaultSlug = toSlug(title);
const slugInput = ask(`Slug [${defaultSlug}]:`);
const slug = slugInput || defaultSlug;

const appDir = join(APPS_DIR, slug);
if (existsSync(appDir)) {
  error(`App "${slug}" already exists.`);
  process.exit(1);
}

let summary = "";
while (true) {
  summary = ask(`Summary (${SUMMARY_MIN}-${SUMMARY_MAX} chars):`);
  if (summary.length >= SUMMARY_MIN && summary.length <= SUMMARY_MAX) break;
  const count = summary.length;
  const delta =
    count < SUMMARY_MIN
      ? `${SUMMARY_MIN - count} more needed`
      : `${count - SUMMARY_MAX} over limit`;
  warn(`${count} chars (${delta}) -- target: ${SUMMARY_MIN}-${SUMMARY_MAX}`);
}

const tagsInput = ask("Tags (comma-separated, or empty):");
const tags = tagsInput
  ? tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  : [];

const date = nowISO();
mkdirSync(appDir, { recursive: true });
writeFileSync(join(appDir, "index.md"), indexMd(title, summary, tags, date));
writeFileSync(join(appDir, "App.astro"), appAstro(slug));

console.log("");
success(`Created src/content/apps/${slug}/index.md`);
success(`Created src/content/apps/${slug}/App.astro`);
info("The app is a draft. Edit App.astro to build it out.");
console.log("");
