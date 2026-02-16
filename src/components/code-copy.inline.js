(() => {
  var FEEDBACK_MS = 2000;
  var PROCESSED = "code-processed";

  var COPY_ICON =
    '<svg class="icon-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
    "</svg>" +
    '<svg class="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
    '<polyline points="20 6 9 17 4 12"></polyline>' +
    "</svg>";

  function detectLang(pre, code) {
    var lang = pre.dataset.language || "";
    if (lang) return lang;
    const cls = Array.from(code.classList).find((c) => c.startsWith("language-"));
    return cls ? cls.replace("language-", "") : "";
  }

  function wrapPre(pre) {
    var wrapper = document.createElement("div");
    wrapper.className = "code-wrapper";
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
    return wrapper;
  }

  function addCopyButton(wrapper, text) {
    var btn = document.createElement("button");
    btn.className = "code-copy";
    btn.setAttribute("aria-label", "Copy code");
    btn.innerHTML = COPY_ICON;

    btn.addEventListener("click", () => {
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add("copied");
        btn.setAttribute("aria-label", "Copied!");
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.setAttribute("aria-label", "Copy code");
        }, FEEDBACK_MS);
      });
    });

    wrapper.appendChild(btn);
  }

  function initCodeCopy() {
    document.querySelectorAll(".content pre").forEach((pre) => {
      if (pre.classList.contains(PROCESSED)) return;
      if (pre.dataset.language === "mermaid") return;
      pre.classList.add(PROCESSED);

      var code = pre.querySelector("code");
      if (!code) return;

      var lang = detectLang(pre, code);
      var wrapper = wrapPre(pre);

      if (lang) {
        const label = document.createElement("span");
        label.className = "code-lang";
        label.textContent = lang;
        wrapper.appendChild(label);
      }

      addCopyButton(wrapper, code.textContent || "");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCodeCopy);
  } else {
    initCodeCopy();
  }
  document.addEventListener("astro:page-load", initCodeCopy);
})();
