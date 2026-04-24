// Opens the containing <details> when a hash targets a week anchor, and
// scrolls the target into view. Guarded so View Transition navigations don't
// accumulate duplicate listeners.
if (!window.__mscDetailsInit) {
  window.__mscDetailsInit = true;
  const openForHash = () => {
    const hash = location.hash.replace(/^#/, "");
    if (!hash) return;
    const target = document.getElementById(hash);
    if (!target) return;
    const details = target.closest("details.msc-semester");
    if (details && !details.open) details.open = true;
    if (target !== details) target.scrollIntoView({ behavior: "instant", block: "start" });
  };
  document.addEventListener("astro:page-load", openForHash);
  window.addEventListener("hashchange", openForHash);
}
