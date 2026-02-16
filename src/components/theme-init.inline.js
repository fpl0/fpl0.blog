(() => {
  var themeColors = { light: "#faf5ea", dark: "#17100e" };
  function getTheme() {
    var stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function syncThemeColor(theme) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach((m) => {
      m.setAttribute("content", themeColors[theme]);
    });
  }
  var theme = getTheme();
  document.documentElement.setAttribute("data-theme", theme);
  syncThemeColor(theme);
  document.addEventListener("astro:before-swap", (e) => {
    var t = getTheme();
    e.newDocument.documentElement.setAttribute("data-theme", t);
    e.newDocument.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute("content", themeColors[t]);
    });
  });
})();
