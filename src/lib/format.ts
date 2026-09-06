/** UTC calendar date (YYYY-MM-DD) — matches the frontmatter source, the
 * <time datetime> attribute, and the RSS pubDate day, regardless of the
 * build machine's timezone. */
export function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Human-friendly UTC date: "28 July 2026" */
export function friendlyDate(date: Date): string {
  const day = date.getUTCDate();
  const month = date.toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
