/** UTC calendar date (YYYY-MM-DD) — matches the frontmatter source, the
 * <time datetime> attribute, and the RSS pubDate day, regardless of the
 * build machine's timezone. */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
