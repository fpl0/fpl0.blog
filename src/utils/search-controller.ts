/**
 * SearchController — Extracted state and logic for SearchModal.
 *
 * Encapsulates modal lifecycle, keyboard routing, debounced search,
 * and navigation. Wired up by SearchModal.astro's <script> block.
 */

import { navigate } from "astro:transitions/client";
import { renderError, renderResults } from "./search-renderer";
import type { SearchItem } from "./search-service";
import {
  abortFetch,
  getLatestPosts,
  isIndexLoaded,
  loadSearchIndex,
  searchPosts,
} from "./search-service";

const DEBOUNCE_MS = 150;

export class SearchController {
  selectedIndex = 0;
  results: SearchItem[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private previousActiveElement: Element | null = null;
  private cacheBuster: string;

  constructor(cacheBuster: string) {
    this.cacheBuster = cacheBuster;
  }

  open(): void {
    const backdrop = document.getElementById("search-backdrop");
    const input = document.getElementById("search-input") as HTMLInputElement | null;

    this.previousActiveElement = document.activeElement;
    backdrop?.classList.add("is-open");
    document.documentElement.classList.add("is-searching");
    document.body.style.overflow = "hidden";

    // Double rAF ensures the browser has painted visibility:visible before focusing
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        input?.focus();
        input?.select();
      }),
    );

    // Show loading state if index not ready
    this.selectedIndex = 0;
    if (!isIndexLoaded()) {
      renderResults([], this.selectedIndex, true);
      loadSearchIndex(this.cacheBuster, renderError).then(() => {
        this.results = getLatestPosts();
        renderResults(this.results, this.selectedIndex);
      });
    } else {
      this.results = getLatestPosts();
      renderResults(this.results, this.selectedIndex);
    }
  }

  close(): void {
    const backdrop = document.getElementById("search-backdrop");
    const input = document.getElementById("search-input") as HTMLInputElement | null;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    abortFetch();

    backdrop?.classList.remove("is-open");
    document.documentElement.classList.remove("is-searching");
    if (input) input.value = "";
    this.results = [];
    this.selectedIndex = 0;
    renderResults([], this.selectedIndex);
    document.body.style.overflow = "";

    if (this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus();
    }
    this.previousActiveElement = null;
  }

  navigateToSelected(): void {
    const selectedResult = this.results[this.selectedIndex];
    if (selectedResult) {
      const url =
        selectedResult.type === "app"
          ? `/apps/${selectedResult.slug}/`
          : `/blog/${selectedResult.slug}/`;
      this.close();
      navigate(url);
    }
  }

  handleKeydown(e: KeyboardEvent): void {
    const backdrop = document.getElementById("search-backdrop");

    // Toggle search with Cmd/Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      backdrop?.classList.contains("is-open") ? this.close() : this.open();
      return;
    }

    // Early return if modal not open
    if (!backdrop?.classList.contains("is-open")) return;

    switch (e.key) {
      case "Escape":
        this.close();
        break;
      case "ArrowDown":
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        renderResults(this.results, this.selectedIndex);
        break;
      case "ArrowUp":
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        renderResults(this.results, this.selectedIndex);
        break;
      case "Enter":
        e.preventDefault();
        this.navigateToSelected();
        break;
      case "Tab":
        this.trapFocus(e, backdrop);
        break;
      default:
        break;
    }
  }

  private trapFocus(e: KeyboardEvent, backdrop: HTMLElement): void {
    const modal = backdrop.querySelector(".search-modal");
    if (!modal) return;
    const focusable = modal.querySelectorAll<HTMLElement>(
      'input, button, a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0] as HTMLElement | undefined;
    const last = focusable[focusable.length - 1] as HTMLElement | undefined;
    if (first && last) {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  handleInput(value: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.selectedIndex = 0;
      this.results = value.trim() ? searchPosts(value) : getLatestPosts();
      renderResults(this.results, this.selectedIndex);
    }, DEBOUNCE_MS);
  }

  cleanup(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    abortFetch();
  }
}
