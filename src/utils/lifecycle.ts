/**
 * Shared lifecycle utility for Astro components with View Transitions.
 * Manages AbortController cleanup across navigations via astro:page-load.
 *
 * Use this when your init callback registers listeners on persistent objects
 * (window, document) or creates observers/RAF loops that need cleanup.
 * For idempotent DOM manipulation, use a direct astro:page-load listener instead.
 */
export function onPageReady(init: (signal: AbortSignal) => void): void {
  let controller: AbortController | null = null;

  function handler(): void {
    controller?.abort();
    controller = new AbortController();
    init(controller.signal);
  }

  document.addEventListener("astro:page-load", handler);
}
