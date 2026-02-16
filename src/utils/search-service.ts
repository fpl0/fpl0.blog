/**
 * Search Service — pure search logic with no DOM dependencies.
 *
 * Handles index loading, caching, fuzzy search with recency decay,
 * and latest-posts retrieval.
 */

import { fuzzyMatch } from "./search";

export interface SearchItem {
  readonly title: string;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly slug: string;
  readonly date: string;
  readonly type?: "post" | "app";
}

const SEARCH_WEIGHTS = {
  TITLE: 10,
  TAG: 5,
  SUMMARY: 1,
} as const;

const MAX_RESULTS = 8;
const LATEST_POSTS_COUNT = 3;
const FETCH_TIMEOUT_MS = 5000;

/** Exponential decay parameter for recency weighting. */
const DECAY_LAMBDA = 0.005;
const MS_PER_DAY = 86400000;

let searchIndex: SearchItem[] = [];
let indexPromise: Promise<void> | null = null;
let fetchAbortController: AbortController | null = null;

/**
 * Search the index with fuzzy matching and recency decay.
 * Returns an empty array if the query is blank.
 */
export function searchPosts(query: string): SearchItem[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const now = Date.now();

  const scored = searchIndex.map((post) => {
    const titleScore = fuzzyMatch(trimmedQuery, post.title) * SEARCH_WEIGHTS.TITLE;

    const tagScore =
      post.tags.reduce((best, tag) => Math.max(best, fuzzyMatch(trimmedQuery, tag)), 0) *
      SEARCH_WEIGHTS.TAG;

    const summaryScore = fuzzyMatch(trimmedQuery, post.summary) * SEARCH_WEIGHTS.SUMMARY;

    const baseScore = titleScore + tagScore + summaryScore;
    if (baseScore <= 0) return { post, score: 0 };

    // Probabilistic Recency Weighting
    // score = baseScore * (1 + e^(-lambda * daysOld))
    const daysOld = (now - new Date(post.date).getTime()) / MS_PER_DAY;
    const recencyBoost = Math.exp(-DECAY_LAMBDA * Math.max(0, daysOld));

    return { post, score: baseScore * (1 + recencyBoost) };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((item) => item.post);
}

/**
 * Get the most recently published items from the index.
 */
export function getLatestPosts(): SearchItem[] {
  return [...searchIndex]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, LATEST_POSTS_COUNT);
}

/**
 * Whether the search index has been loaded.
 */
export function isIndexLoaded(): boolean {
  return searchIndex.length > 0;
}

/**
 * Abort any in-flight fetch for the search index.
 */
export function abortFetch(): void {
  if (fetchAbortController) {
    fetchAbortController.abort();
    fetchAbortController = null;
  }
}

/**
 * Load the search index from the server.
 * Caches the result for subsequent calls.
 *
 * @param cacheBuster - version string to append to the URL
 * @param onError - callback invoked if loading fails
 */
export function loadSearchIndex(
  cacheBuster: string,
  onError?: (message: string) => void,
): Promise<void> {
  if (searchIndex.length > 0) return Promise.resolve();

  // Return existing promise if already loading
  if (indexPromise) return indexPromise;

  indexPromise = (async () => {
    try {
      fetchAbortController = new AbortController();
      const timeoutId = setTimeout(() => fetchAbortController?.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(`/search.json?v=${cacheBuster}`, {
        signal: fetchAbortController.signal,
      });
      clearTimeout(timeoutId);
      fetchAbortController = null;

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      searchIndex = await response.json();
    } catch {
      fetchAbortController = null;
      // Clear cached promise so next attempt retries
      indexPromise = null;
      onError?.("Failed to load search index. Please try again.");
    }
  })();

  return indexPromise;
}
