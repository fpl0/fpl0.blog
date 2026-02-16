(() => {
  var loaded = false;
  var GA_ID = "G-1QYZZMNKT7";

  function loadGA() {
    if (loaded) return;
    loaded = true;

    var s = document.createElement("script");
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    s.async = true;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args) {
      dataLayer.push(...args);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", GA_ID);
  }

  // Load on interaction or after 3s
  ["scroll", "click", "touchstart", "keydown"].forEach((e) => {
    document.addEventListener(e, loadGA, { once: true, passive: true });
  });
  setTimeout(loadGA, 3000);

  // Handle Astro page transitions
  document.addEventListener("astro:page-load", loadGA);
})();
