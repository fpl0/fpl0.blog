/**
 * Publish a content entry (blog post or app).
 *
 * Usage:
 *   bun run 0:publish <slug> [--no-push]
 *
 * Sets isDraft to false, sets publicationDate to today (if not already set),
 * then commits and pushes.
 */

import { findContentFile, gitStep, relativePath, todayISO } from "./base";
import { noPush, printAvailableSlugs, printHelp, wantsHelp } from "./cli";
import { error, heading, info, success, warn } from "./fmt";
import {
  getBooleanField,
  insertFieldAfter,
  parseFrontmatterBlock,
  setFrontmatterField,
  writeFrontmatter,
} from "./frontmatter";

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

if (wantsHelp()) {
  printHelp({
    command: "0:publish",
    summary: "Publish a draft content entry",
    usage: "bun run 0:publish <slug> [--no-push]",
    args: ["<slug>  The content slug to publish"],
    flags: ["--no-push  Commit but skip git push"],
    examples: ["bun run 0:publish my-first-post", "bun run 0:publish my-app --no-push"],
  });
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Frontmatter mutation
// ---------------------------------------------------------------------------

function publish(filePath: string): {
  title: string;
  alreadyPublished: boolean;
} {
  const block = parseFrontmatterBlock(filePath);
  if (!block) {
    error("Could not parse frontmatter.");
    process.exit(1);
  }

  const isDraft = getBooleanField(block.yaml, "isDraft");
  if (isDraft === false) {
    return { title: block.title, alreadyPublished: true };
  }

  block.yaml = setFrontmatterField(block.yaml, "isDraft", "false");

  const hasPubDate = /^publicationDate:/m.test(block.yaml);
  if (!hasPubDate) {
    block.yaml = insertFieldAfter(block.yaml, "createdDate", "publicationDate", `"${todayISO()}"`);
  }

  writeFrontmatter(filePath, block);
  return { title: block.title, alreadyPublished: false };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const slug = process.argv[2];

if (!slug || slug.startsWith("-")) {
  error("Missing slug argument.");
  console.error("");
  console.error(`  Usage: bun run 0:publish <slug> [--no-push]`);
  console.error("");
  printAvailableSlugs();
  process.exit(1);
}

const content = findContentFile(slug);
if (!content) {
  error(`No content found for slug "${slug}".`);
  printAvailableSlugs();
  process.exit(1);
}

const { title, alreadyPublished } = publish(content.path);

if (alreadyPublished) {
  info(`"${title}" is already published.`);
  process.exit(0);
}

heading(`Publish: ${title}`);
success(`Set isDraft: false (${content.type})`);

const rel = relativePath(content.path);
gitStep(`git add ${rel}`, "Staging changes");
gitStep(`git commit -m "publish: ${title}"`, "Committing");

if (noPush()) {
  warn("Skipped push (--no-push)");
} else {
  gitStep("git push", "Pushing to remote");
}

console.log("");
