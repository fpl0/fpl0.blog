/**
 * Delete a content entry (blog post or app).
 *
 * Usage:
 *   bun run 0:delete <slug> [--no-push]
 *
 * Removes all files for the given slug, then commits and pushes.
 */

import { existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

import { APPS_DIR, APPS_PAGES, BLOG_DIR, gitStep, relativePath } from "./base";
import { noPush, printAvailableSlugs, printHelp, wantsHelp } from "./cli";
import { error, heading, red, success, warn } from "./fmt";

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

if (wantsHelp()) {
  printHelp({
    command: "0:delete",
    summary: "Permanently delete a content entry",
    usage: "bun run 0:delete <slug> [--no-push]",
    args: ["<slug>  The content slug to delete"],
    flags: ["--no-push  Commit but skip git push"],
    examples: ["bun run 0:delete my-old-post"],
  });
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Find all paths to delete for a slug
// ---------------------------------------------------------------------------

interface DeleteTarget {
  type: "post" | "app";
  paths: string[];
}

function findTarget(slug: string): DeleteTarget | null {
  const blogDir = join(BLOG_DIR, slug);
  if (existsSync(blogDir) && statSync(blogDir).isDirectory()) {
    return { type: "post", paths: [blogDir] };
  }

  const appDir = join(APPS_DIR, slug);
  if (existsSync(appDir) && statSync(appDir).isDirectory()) {
    const paths = [appDir];
    const pageFile = join(APPS_PAGES, `${slug}.astro`);
    if (existsSync(pageFile)) paths.push(pageFile);
    return { type: "app", paths };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const slug = process.argv[2];

if (!slug || slug.startsWith("-")) {
  error("Missing slug argument.");
  console.error("");
  console.error(`  Usage: bun run 0:delete <slug> [--no-push]`);
  console.error("");
  printAvailableSlugs();
  process.exit(1);
}

const target = findTarget(slug);
if (!target) {
  error(`No content found for slug "${slug}".`);
  printAvailableSlugs();
  process.exit(1);
}

const relativePaths = target.paths.map(relativePath);

heading(`Delete: ${slug}`);
warn(`This will permanently delete the following ${target.type}:`);
console.log("");
for (const p of relativePaths) {
  console.log(`    ${red(p)}`);
}
console.log("");

const answer = prompt("  Proceed? (y/N):");
if (answer?.toLowerCase() !== "y") {
  console.log("\n  Aborted.\n");
  process.exit(0);
}

console.log("");

for (const p of target.paths) {
  rmSync(p, { recursive: true });
}
success("Deleted files");

for (const p of relativePaths) {
  gitStep(`git add ${p}`, "Staging changes");
}
gitStep(`git commit -m "delete: ${slug}"`, "Committing");

if (noPush()) {
  warn("Skipped push (--no-push)");
} else {
  gitStep("git push", "Pushing to remote");
}

console.log("");
