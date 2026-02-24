(() => {
  var p = navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform;
  var isMac = /Mac|iPhone|iPad|iPod/i.test(p || "");
  if (!isMac) document.documentElement.setAttribute("data-platform", "other");
  document.addEventListener("astro:before-swap", (e) => {
    if (!isMac) e.newDocument.documentElement.setAttribute("data-platform", "other");
  });
})();
