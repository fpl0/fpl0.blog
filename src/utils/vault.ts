/**
 * Converts an Obsidian note name (filename without extension) to a URL slug.
 * Used both for content collection IDs and wikilink resolution — must stay in sync
 * with the inline copy in astro.config.mjs.
 *
 * Examples:
 *   "W01 — The Landscape"                     → "w01--the-landscape"
 *   "1.1 — Introduction to Cognitive Science" → "1-1--introduction-to-cognitive-science"
 *   "Beer (2000) — Dynamical Approaches"       → "beer-2000--dynamical-approaches"
 */
export function slugifyNoteName(name: string): string {
  return name
    .replace(/\.md$/, "")
    .toLowerCase()
    .replace(/ — /g, "--")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
