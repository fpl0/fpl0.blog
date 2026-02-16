(() => {
  function initThemeToggle() {
    var toggle = document.getElementById("theme-toggle");
    if (!toggle || toggle.dataset.initialized) return;
    toggle.dataset.initialized = "true";

    toggle.addEventListener("click", () => {
      var current = document.documentElement.getAttribute("data-theme") || "dark";
      var next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);

      var themeColors = { light: "#faf5ea", dark: "#17100e" };
      var metas = document.querySelectorAll('meta[name="theme-color"]');
      metas.forEach((m) => {
        m.setAttribute("content", themeColors[next]);
      });

      var announce = document.getElementById("theme-announce");
      if (announce) {
        announce.textContent = `Switched to ${next} theme`;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initThemeToggle);
  } else {
    initThemeToggle();
  }
  document.addEventListener("astro:page-load", initThemeToggle);
})();
