/**
 * Shared frontmatter mutation utilities for publish/unpublish scripts.
 */

import { readFileSync, writeFileSync } from "node:fs";

export interface FrontmatterBlock {
  /** Opening delimiter (e.g. "---\n") */
  open: string;
  /** Raw YAML content between the delimiters */
  yaml: string;
  /** Closing delimiter (e.g. "\n---") */
  close: string;
  /** Everything after the closing delimiter */
  rest: string;
  /** Parsed title from the YAML */
  title: string;
}

/**
 * Parse frontmatter from a file into its constituent parts.
 * Returns null if frontmatter cannot be parsed.
 */
export function parseFrontmatterBlock(filePath: string): FrontmatterBlock | null {
  const raw = readFileSync(filePath, "utf-8");
  const match = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!match) return null;

  const open = match[1] ?? "";
  const yaml = match[2] ?? "";
  const close = match[3] ?? "";
  const rest = raw.slice(match[0].length);

  const titleMatch = yaml.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  const title = titleMatch?.[1] ?? "unknown";

  return { open, yaml, close, rest, title };
}

/**
 * Get the value of a boolean frontmatter field.
 * Returns undefined if the field is not found.
 */
export function getBooleanField(yaml: string, key: string): boolean | undefined {
  const re = new RegExp(`^${key}:\\s*(true|false)\\s*$`, "m");
  const match = yaml.match(re);
  if (!match?.[1]) return undefined;
  return match[1] === "true";
}

/**
 * Set a frontmatter field value. Updates existing or appends.
 */
export function setFrontmatterField(yaml: string, key: string, value: string): string {
  const re = new RegExp(`^${key}:.*$`, "m");
  if (re.test(yaml)) {
    return yaml.replace(re, `${key}: ${value}`);
  }
  return `${yaml}\n${key}: ${value}`;
}

/**
 * Insert a frontmatter field after another field. Falls back to appending.
 */
export function insertFieldAfter(
  yaml: string,
  afterKey: string,
  key: string,
  value: string,
): string {
  const re = new RegExp(`^(${afterKey}:.*$)`, "m");
  if (re.test(yaml)) {
    return yaml.replace(re, `$1\n${key}: ${value}`);
  }
  return `${yaml}\n${key}: ${value}`;
}

/**
 * Write the modified frontmatter block back to the file.
 */
export function writeFrontmatter(filePath: string, block: FrontmatterBlock): void {
  writeFileSync(filePath, `${block.open}${block.yaml}${block.close}${block.rest}`);
}
