(() => {
  function getTheme() {
    var stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", getTheme());
  document.addEventListener("astro:before-swap", (e) => {
    e.newDocument.documentElement.setAttribute("data-theme", getTheme());
  });
})();
