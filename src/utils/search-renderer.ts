/**
 * Search Renderer — DOM-writing helpers for SearchModal results.
 *
 * Takes search data and produces HTML strings. No search logic here.
 */

import type { SearchItem } from "./search-service";

const MAX_VISIBLE_TAGS = 3;

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Render an error message into the search results container.
 */
export function renderError(message: string): void {
  const container = document.getElementById("search-results");
  if (!container) return;
  container.innerHTML = `<div class="search-empty">${message}</div>`;
}

/**
 * Render search results (or loading/empty state) into the container.
 */
export function renderResults(items: SearchItem[], selectedIndex: number, loading = false): void {
  const container = document.getElementById("search-results");
  if (!container) return;

  if (loading) {
    container.innerHTML = `<div class="search-empty">Loading...</div>`;
    return;
  }

  if (items.length === 0) {
    const input = document.getElementById("search-input") as HTMLInputElement | null;
    container.innerHTML = `<div class="search-empty">${
      input?.value ? "No results found" : "Type to search..."
    }</div>`;
    return;
  }

  container.innerHTML = items
    .map((item, i) => {
      const isSelected = i === selectedIndex;
      const visibleTags = item.tags.slice(0, MAX_VISIBLE_TAGS);
      const tagsHtml =
        visibleTags.length > 0
          ? `<span class="search-result-tags">${visibleTags.map((t) => `<span class="search-tag">${escapeHtml(t)}</span>`).join("")}</span>`
          : "";

      const itemUrl = item.type === "app" ? `/apps/${item.slug}/` : `/blog/${item.slug}/`;

      return `
          <a href="${itemUrl}"
             class="search-result ${isSelected ? "is-selected" : ""}"
             data-index="${i}"
             role="option"
             aria-selected="${isSelected}"
             data-astro-prefetch="hover">
            <div class="search-result-title">${escapeHtml(item.title)}${item.type === "app" ? '<span class="search-result-type">app</span>' : ""}</div>
            <div class="search-result-meta">
              <span class="search-result-summary">${escapeHtml(item.summary)}</span>
              ${tagsHtml}
            </div>
          </a>
        `;
    })
    .join("");
}
