(() => {
  const panels = () => Array.from(document.querySelectorAll("[data-sem-panel]"));
  const tabs = () => Array.from(document.querySelectorAll("[data-sem-tab]"));

  const semForWeek = (ps, n) => {
    for (const p of ps) {
      const range = (p.getAttribute("data-sem-weeks") || "").split("-");
      const lo = parseInt(range[0], 10);
      const hi = parseInt(range[1], 10);
      const valid = !(Number.isNaN(lo) || Number.isNaN(hi));
      if (valid && n >= lo && n <= hi) {
        return p.getAttribute("data-sem-panel");
      }
    }
    return null;
  };

  const defaultSem = (ps) => {
    const active = ps.find((p) => p.getAttribute("data-sem-active") === "true");
    return (active ?? ps[0]).getAttribute("data-sem-panel");
  };

  const resolveSem = () => {
    const ps = panels();
    if (ps.length === 0) return null;
    const hash = window.location.hash || "";
    if (hash.indexOf("#semester-") === 0) return hash.slice(10);
    if (hash.indexOf("#week-") === 0) {
      const n = parseInt(hash.slice(6), 10);
      const match = semForWeek(ps, n);
      if (match) return match;
    }
    return defaultSem(ps);
  };

  const activate = (sem) => {
    for (const p of panels()) {
      p.hidden = p.getAttribute("data-sem-panel") !== sem;
    }
    for (const t of tabs()) {
      const on = t.getAttribute("data-sem-tab") === sem;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    }
  };

  const applyHash = () => {
    if (panels().length === 0) return;
    const sem = resolveSem();
    if (sem) activate(sem);
  };

  const onClick = (e) => {
    const t = e.target?.closest?.("[data-sem-tab]");
    if (!t) return;
    e.preventDefault();
    const sem = t.getAttribute("data-sem-tab");
    if (!sem) return;
    if (history.replaceState) {
      history.replaceState(null, "", `#semester-${sem}`);
    }
    activate(sem);
    document.getElementById("curriculum-heading")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (!window.__mscTabsWired) {
    window.__mscTabsWired = true;
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", applyHash);
    document.addEventListener("astro:page-load", applyHash);
  }
  applyHash();
})();
