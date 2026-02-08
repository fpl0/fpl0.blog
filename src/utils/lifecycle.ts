/**
 * Shared lifecycle utility for Astro components with View Transitions.
 * Manages AbortController cleanup and dual event registration
 * (DOMContentLoaded + astro:page-load).
 */
export function onPageReady(init: (signal: AbortSignal) => void): void {
  let controller: AbortController | null = null;

  function handler(): void {
    controller?.abort();
    controller = new AbortController();
    init(controller.signal);
  }

  document.addEventListener("DOMContentLoaded", handler);
  document.addEventListener("astro:page-load", handler);
}
