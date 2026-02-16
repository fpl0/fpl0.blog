/**
 * Delegated click handler for all search trigger buttons.
 * Dispatches a synthetic Cmd/Ctrl+K to open the SearchModal.
 * Runs once at module load — survives View Transitions without cleanup.
 */
document.addEventListener("click", (e) => {
  const trigger = (e.target as Element).closest("#site-nav-search, #app-shell-search");
  if (trigger) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        ctrlKey: true,
        bubbles: true,
      }),
    );
  }
});
