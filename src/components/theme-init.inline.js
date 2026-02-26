(() => {
  var themeColors = { light: "__THEME_LIGHT__", dark: "__THEME_DARK__" };
  function getTheme() {
    // URL ?theme= param takes priority (used by fpl0.panel iframe previews)
    var param = new URL(window.location).searchParams.get("theme");
    if (param === "light" || param === "dark") return param;

    var stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    syncThemeColor(theme);
  }
  function syncThemeColor(theme) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((m) => {
      m.setAttribute("content", themeColors[theme]);
    });
  }
  var theme = getTheme();
  applyTheme(theme);
  document.addEventListener("astro:before-swap", (e) => {
    var t = getTheme();
    e.newDocument.documentElement.setAttribute("data-theme", t);
    e.newDocument.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", themeColors[t]);
    });
  });
  // Listen for theme changes from parent (fpl0.panel iframe postMessage)
  window.addEventListener("message", (e) => {
    if (
      e.data &&
      e.data.type === "setTheme" &&
      (e.data.theme === "light" || e.data.theme === "dark")
    ) {
      applyTheme(e.data.theme);
    }
  });
})();
