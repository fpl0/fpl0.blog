/**
 * Unpublish a content entry (blog post or app).
 *
 * Usage:
 *   bun run 0:unpublish <slug> [--no-push]
 *
 * Sets isDraft to true, then commits and pushes.
 */

import { findContentFile, gitStep, relativePath } from "./base";
import { noPush, printAvailableSlugs, printHelp, wantsHelp } from "./cli";
import { error, heading, info, success, warn } from "./fmt";
import {
  getBooleanField,
  parseFrontmatterBlock,
  setFrontmatterField,
  writeFrontmatter,
} from "./frontmatter";

// ---------------------------------------------------------------------------
// Help
// ---------------------------------------------------------------------------

if (wantsHelp()) {
  printHelp({
    command: "0:unpublish",
    summary: "Revert a published entry to draft",
    usage: "bun run 0:unpublish <slug> [--no-push]",
    args: ["<slug>  The content slug to unpublish"],
    flags: ["--no-push  Commit but skip git push"],
    examples: ["bun run 0:unpublish my-first-post"],
  });
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Frontmatter mutation
// ---------------------------------------------------------------------------

function unpublish(filePath: string): {
  title: string;
  alreadyDraft: boolean;
} {
  const block = parseFrontmatterBlock(filePath);
  if (!block) {
    error("Could not parse frontmatter.");
    process.exit(1);
  }

  const isDraft = getBooleanField(block.yaml, "isDraft");
  if (isDraft === true) {
    return { title: block.title, alreadyDraft: true };
  }

  block.yaml = setFrontmatterField(block.yaml, "isDraft", "true");

  writeFrontmatter(filePath, block);
  return { title: block.title, alreadyDraft: false };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const slug = process.argv[2];

if (!slug || slug.startsWith("-")) {
  error("Missing slug argument.");
  console.error("");
  console.error(`  Usage: bun run 0:unpublish <slug> [--no-push]`);
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

const { title, alreadyDraft } = unpublish(content.path);

if (alreadyDraft) {
  info(`"${title}" is already a draft.`);
  process.exit(0);
}

heading(`Unpublish: ${title}`);
success(`Set isDraft: true (${content.type})`);

const rel = relativePath(content.path);
gitStep(`git add ${rel}`, "Staging changes");
gitStep(`git commit -m "unpublish: ${title}"`, "Committing");

if (noPush()) {
  warn("Skipped push (--no-push)");
} else {
  gitStep("git push", "Pushing to remote");
}

console.log("");
