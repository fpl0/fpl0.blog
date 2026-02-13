/**
 * Publishing indicator — polls GitHub Actions deploy status.
 *
 * Module-level singleton state persists across View Transitions.
 * Called via onPageReady: re-injects the ring SVG and re-applies
 * state on each navigation (DOM is swapped, but module scope survives).
 */

const API_URL =
  "https://api.github.com/repos/fpl0/fpl0.github.io/actions/workflows/deploy.yml/runs?per_page=1";
const POLL_INTERVAL = 90_000;
const INITIAL_DELAY = 5_000;
const MIN_REFETCH = 60_000;

const RING_SVG =
  '<svg class="publishing-ring" width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true"><circle stroke="currentColor" stroke-width="2" fill="transparent" r="20" cx="22" cy="22"/></svg>';

// Module-level singleton — survives View Transitions
let active = false;
let lastCheck = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function ensureRing(toggle: HTMLElement): void {
  if (!toggle.querySelector(".publishing-ring")) {
    toggle.insertAdjacentHTML("afterbegin", RING_SVG);
  }
}

function applyState(toggle: HTMLElement): void {
  toggle.classList.toggle("is-publishing", active);
}

function checkDeploy(): void {
  fetch(API_URL)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.workflow_runs?.length) return;
      const status = data.workflow_runs[0].status;
      const wasActive = active;
      active = status === "in_progress" || status === "queued";
      lastCheck = Date.now();

      const toggle = document.getElementById("theme-toggle");
      if (toggle) applyState(toggle);

      if (timer) clearTimeout(timer);
      if (active) {
        timer = setTimeout(checkDeploy, POLL_INTERVAL);
      } else if (wasActive) {
        timer = null;
      }
    })
    .catch(() => {
      /* silently ignore errors */
    });
}

/**
 * Initialise publishing indicator on page ready.
 * Matches the `onPageReady` callback signature (receives AbortSignal).
 * The signal is not used for the polling timer — the timer is module-scoped
 * and persists across navigations.
 */
export function initPublishing(_signal: AbortSignal): void {
  const toggle = document.getElementById("theme-toggle");
  if (!toggle) return;

  ensureRing(toggle);
  applyState(toggle);

  const elapsed = Date.now() - lastCheck;
  if (elapsed >= MIN_REFETCH && !timer) {
    timer = setTimeout(checkDeploy, INITIAL_DELAY);
  }
}
