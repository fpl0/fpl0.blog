/**
 * Publish a content entry (blog post or app).
 *
 * Usage:
 *   bun run 0:publish <slug>
 *
 * Sets isDraft to false, sets publicationDate to today (if not already set),
 * then commits and pushes.
 */

import { findContentFile, git, printAvailableSlugs, relativePath, todayISO } from "./base";
import {
  getBooleanField,
  insertFieldAfter,
  parseFrontmatterBlock,
  setFrontmatterField,
  writeFrontmatter,
} from "./frontmatter";

// ---------------------------------------------------------------------------
// Frontmatter mutation
// ---------------------------------------------------------------------------

function publish(filePath: string): {
  title: string;
  alreadyPublished: boolean;
} {
  const block = parseFrontmatterBlock(filePath);
  if (!block) {
    console.error("Could not parse frontmatter.");
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

if (!slug) {
  console.error("\nUsage: bun run 0:publish <slug>\n");
  printAvailableSlugs();
  process.exit(1);
}

const content = findContentFile(slug);
if (!content) {
  console.error(`\nNo content found for slug "${slug}".\n`);
  printAvailableSlugs();
  process.exit(1);
}

const { title, alreadyPublished } = publish(content.path);

if (alreadyPublished) {
  console.log(`\n"${title}" is already published.\n`);
  process.exit(0);
}

console.log(`\nPublished: ${title} (${content.type})`);

const rel = relativePath(content.path);
git(`git add ${rel}`);
git(`git commit -m "publish: ${title}"`);
git("git push");

console.log("\nCommitted and pushed.\n");
