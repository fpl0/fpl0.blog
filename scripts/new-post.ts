/**
 * Scaffold a new blog post.
 *
 * Usage:
 *   bun run 0:new-post
 *
 * Creates:
 *   - src/content/blog/<slug>/index.mdx
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ask, BLOG_DIR, todayISO, toSlug } from "./base";
import { printHelp, wantsHelp } from "./cli";
import { SUMMARY_MAX, SUMMARY_MIN } from "./constants";
import { error, heading, info, success, warn } from "./fmt";

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

if (wantsHelp()) {
  printHelp({
    command: "0:new-post",
    summary: "Scaffold a new blog post",
    usage: "bun run 0:new-post",
    examples: ["bun run 0:new-post"],
  });
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

function indexMdx(title: string, summary: string, tags: string[], date: string): string {
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

heading("New Blog Post");

const title = ask("Title:");
if (!title) {
  error("Title is required.");
  process.exit(1);
}

const defaultSlug = toSlug(title);
const slugInput = ask(`Slug [${defaultSlug}]:`);
const slug = slugInput || defaultSlug;

const postDir = join(BLOG_DIR, slug);
if (existsSync(postDir)) {
  error(`Post "${slug}" already exists.`);
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

const date = todayISO();
mkdirSync(postDir, { recursive: true });
writeFileSync(join(postDir, "index.mdx"), indexMdx(title, summary, tags, date));

console.log("");
success(`Created src/content/blog/${slug}/index.mdx`);
info("The post is a draft. Write your content in index.mdx.");
console.log("");
