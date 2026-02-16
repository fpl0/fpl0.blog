/**
 * Unpublish a content entry (blog post or app).
 *
 * Usage:
 *   bun run 0:unpublish <slug>
 *
 * Sets isDraft to true, then commits and pushes.
 */

import { findContentFile, git, printAvailableSlugs, relativePath } from "./base";
import {
  getBooleanField,
  parseFrontmatterBlock,
  setFrontmatterField,
  writeFrontmatter,
} from "./frontmatter";

// ---------------------------------------------------------------------------
// Frontmatter mutation
// ---------------------------------------------------------------------------

function unpublish(filePath: string): {
  title: string;
  alreadyDraft: boolean;
} {
  const block = parseFrontmatterBlock(filePath);
  if (!block) {
    console.error("Could not parse frontmatter.");
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

if (!slug) {
  console.error("\nUsage: bun run 0:unpublish <slug>\n");
  printAvailableSlugs();
  process.exit(1);
}

const content = findContentFile(slug);
if (!content) {
  console.error(`\nNo content found for slug "${slug}".\n`);
  printAvailableSlugs();
  process.exit(1);
}

const { title, alreadyDraft } = unpublish(content.path);

if (alreadyDraft) {
  console.log(`\n"${title}" is already a draft.\n`);
  process.exit(0);
}

console.log(`\nUnpublished: ${title} (${content.type})`);

const rel = relativePath(content.path);
git(`git add ${rel}`);
git(`git commit -m "unpublish: ${title}"`);
git("git push");

console.log("\nCommitted and pushed.\n");
