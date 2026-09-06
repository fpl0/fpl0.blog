/** UTC calendar date (YYYY-MM-DD) — matches the frontmatter source, the
 * <time datetime> attribute, and the RSS pubDate day, regardless of the
 * build machine's timezone. */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Human-friendly date format: "28 July 2026" (UTC calendar day). */
export function friendlyDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Approximate reading time in minutes from word count.
 * Assumes ~200 words per minute average reading speed. */
export function readingTime(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200));
}

/** Count words in markdown content (simple whitespace-based heuristic). */
export function countWords(content: string): number {
  return content.trim().split(/\s+/).length;
}
