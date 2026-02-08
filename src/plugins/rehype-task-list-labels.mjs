/**
 * Rehype plugin — adds aria-label to GFM task list checkboxes.
 *
 * remark-gfm emits `<input type="checkbox" disabled>` inside `<li>` without
 * an associated `<label>`, which fails Lighthouse's "Form elements do not
 * have associated labels" audit. This plugin walks the HAST at build time
 * and sets aria-label to the list item's text content.
 */
export default function rehypeTaskListLabels() {
  return (tree) => {
    walk(tree);
  };
}

function walk(node) {
  if (node.children) {
    for (const child of node.children) {
      walk(child);
    }
  }

  if (
    node.tagName === "li" &&
    Array.isArray(node.properties?.className) &&
    node.properties.className.includes("task-list-item")
  ) {
    const checkbox = node.children?.find(
      (c) => c.tagName === "input" && c.properties?.type === "checkbox",
    );
    if (checkbox) {
      checkbox.properties ??= {};
      checkbox.properties.ariaLabel = textContent(node).trim() || "task item";
    }
  }
}

function textContent(node) {
  if (node.type === "text") return node.value || "";
  if (node.children) return node.children.map(textContent).join("");
  return "";
}
