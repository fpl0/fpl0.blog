/**
 * CSP — Auto-discovered inline-script hashing
 *
 * Any `*.inline.js` file co-located with a component is automatically
 * picked up, hashed, and added to the Content-Security-Policy.
 *
 * To add a new inline script:
 *   1. Create `<name>.inline.js` next to the component
 *   2. Import it in the component: `import SCRIPT from './<name>.inline.js?raw'`
 *   3. Render it: `<script is:inline set:html={SCRIPT} />`
 *   — no changes to this file needed.
 */
import { createHash } from "node:crypto";

const modules = import.meta.glob("../components/*.inline.js", {
  query: "?raw",
  import: "default",
  eager: true,
});

const INLINE_SCRIPTS = Object.values(modules) as string[];

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("base64");
}

const SCRIPT_HASHES = INLINE_SCRIPTS.map((s) => `'sha256-${sha256(s)}'`);

/** Returns the full Content-Security-Policy directive string */
export function buildCSP(): string {
  return [
    "default-src 'self'",
    `script-src 'self' ${SCRIPT_HASHES.join(" ")} https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://i.ytimg.com https://pbs.twimg.com https://abs.twimg.com",
    "font-src 'self'",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com",
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
