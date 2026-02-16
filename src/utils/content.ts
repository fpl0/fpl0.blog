import { type CollectionEntry, getCollection } from "astro:content";

/* ==========================================================================
   CONTENT UTILITIES
   Unified logic for fetching, filtering, and processing blog posts and apps.
   ========================================================================== */

export type FeedItem =
  | { type: "post"; entry: CollectionEntry<"blog"> }
  | { type: "app"; entry: CollectionEntry<"apps"> };

/**
 * Common sort comparator for stable date-descending ordering.
 */
function compareEntries(
  a: CollectionEntry<"blog" | "apps">,
  b: CollectionEntry<"blog" | "apps">,
): number {
  const dateDiff = b.data.date.valueOf() - a.data.date.valueOf();
  return dateDiff !== 0 ? dateDiff : a.slug.localeCompare(b.slug);
}

/**
 * Fetch all published (non-draft) blog posts.
 */
export async function getPublishedPosts(): Promise<CollectionEntry<"blog">[]> {
  const posts = await getCollection("blog", ({ data }) => !data.isDraft);
  return posts.sort(compareEntries);
}

/**
 * Fetch all published (non-draft) apps.
 */
export async function getPublishedApps(): Promise<CollectionEntry<"apps">[]> {
  const apps = await getCollection("apps", ({ data }) => !data.isDraft);
  return apps.sort(compareEntries);
}

/**
 * Fetch all published content (posts + apps) as a unified feed.
 */
export async function getFeedItems(): Promise<FeedItem[]> {
  const [posts, apps] = await Promise.all([getPublishedPosts(), getPublishedApps()]);

  const items: FeedItem[] = [
    ...posts.map((entry) => ({ type: "post" as const, entry })),
    ...apps.map((entry) => ({ type: "app" as const, entry })),
  ];

  return items.sort((a, b) => compareEntries(a.entry, b.entry));
}

/**
 * Build a map of tag -> item count from all published content.
 */
export async function getTagCounts(): Promise<Map<string, number>> {
  const [posts, apps] = await Promise.all([getPublishedPosts(), getPublishedApps()]);
  const counts = new Map<string, number>();

  for (const entry of [...posts, ...apps]) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return counts;
}

/**
 * Build a map of tag -> sorted FeedItems from all published content.
 */
export async function getTagMap(): Promise<Map<string, FeedItem[]>> {
  const [posts, apps] = await Promise.all([getPublishedPosts(), getPublishedApps()]);
  const tagMap = new Map<string, FeedItem[]>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      const existing = tagMap.get(tag) ?? [];
      existing.push({ type: "post", entry: post });
      tagMap.set(tag, existing);
    }
  }

  for (const app of apps) {
    for (const tag of app.data.tags) {
      const existing = tagMap.get(tag) ?? [];
      existing.push({ type: "app", entry: app });
      tagMap.set(tag, existing);
    }
  }

  // Sort each tag's items by date descending, then slug
  for (const items of tagMap.values()) {
    items.sort((a, b) => compareEntries(a.entry, b.entry));
  }

  return tagMap;
}

/**
 * Calculate estimated reading time for markdown content.
 * Based on average reading speed of 200 words per minute.
 */
const WORDS_PER_MINUTE = 200;

export function getReadingTime(content: string): string {
  if (!content) return "";

  const cleanText = content
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove link syntax, keep text
    .replace(/#{1,6}\s/g, "") // Remove heading markers
    .replace(/[`*_~]/g, "") // Remove inline formatting
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .trim();

  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));

  return `${minutes} min read`;
}
