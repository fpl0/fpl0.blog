/**
 * Shared CLI infrastructure: --help, --no-push, enhanced slug listing.
 */

import { type Frontmatter, findContentFile, listSlugs, parseFrontmatter } from "./base";
import { bold, cyan, dim, green, yellow } from "./fmt";

// -- Argument helpers ---------------------------------------------------------

export function wantsHelp(): boolean {
  return process.argv.includes("--help") || process.argv.includes("-h");
}

export function noPush(): boolean {
  return process.argv.includes("--no-push");
}

// -- Help display -------------------------------------------------------------

export interface HelpConfig {
  command: string;
  summary: string;
  usage: string;
  args?: string[];
  flags?: string[];
  examples?: string[];
}

export function printHelp(config: HelpConfig): void {
  console.log("");
  console.log(`  ${bold(config.command)}  ${dim("--")}  ${config.summary}`);
  console.log("");
  console.log(`  ${dim("Usage:")}  ${config.usage}`);

  if (config.args && config.args.length > 0) {
    console.log("");
    console.log(`  ${dim("Arguments:")}`);
    for (const a of config.args) {
      console.log(`    ${a}`);
    }
  }

  if (config.flags && config.flags.length > 0) {
    console.log("");
    console.log(`  ${dim("Flags:")}`);
    for (const f of config.flags) {
      console.log(`    ${f}`);
    }
  }

  if (config.examples && config.examples.length > 0) {
    console.log("");
    console.log(`  ${dim("Examples:")}`);
    for (const e of config.examples) {
      console.log(`    ${cyan(e)}`);
    }
  }

  console.log("");
}

// -- Enhanced slug listing ----------------------------------------------------

interface SlugInfo {
  slug: string;
  type: "post" | "app";
  status: "draft" | "published";
  title: string;
}

function getSlugInfoList(): SlugInfo[] {
  const slugs = listSlugs();
  const results: SlugInfo[] = [];

  for (const slug of slugs) {
    const content = findContentFile(slug);
    if (!content) continue;

    let fm: Frontmatter | null = null;
    fm = parseFrontmatter(content.path);
    if (!fm) continue;

    results.push({
      slug,
      type: content.type,
      status: fm.isDraft ? "draft" : "published",
      title: fm.title,
    });
  }

  return results;
}

export function printAvailableSlugs(): void {
  const slugs = getSlugInfoList();
  if (slugs.length === 0) {
    console.error(dim("  No content found."));
    return;
  }

  console.error("");
  console.error(dim("  Available slugs:"));
  console.error("");

  for (const s of slugs) {
    const typeLabel = dim(`[${s.type}]`);
    const statusLabel = s.status === "draft" ? yellow("draft") : green("published");
    console.error(`    ${cyan(s.slug)}  ${typeLabel}  ${statusLabel}  ${dim(s.title)}`);
  }

  console.error("");
}
