// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import remarkGfm from "remark-gfm";
import remarkWikiLink from "remark-wiki-link";

import rehypeMermaidDual from "./src/plugins/rehype-mermaid-dual.mjs";

// Inline copy of src/utils/vault.ts slugifyNoteName — astro.config.mjs is plain
// JS and cannot import TypeScript directly. Keep in sync with vault.ts.
const slugifyNoteName = (name) =>
  name
    .replace(/\.md$/, "")
    .toLowerCase()
    .replace(/ — /g, "--")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

// https://astro.build/config
export default defineConfig({
  devToolbar: { enabled: false },
  site: "https://fpl0.io",
  base: "/",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport", // Prefetch links when they enter viewport
  },
  build: {
    inlineStylesheets: "always",
  },
  integrations: [
    sitemap({
      serialize(item) {
        item.lastmod = new Date();
        return item;
      },
    }),
    mdx(),
  ],
  image: {
    // Optimize images to WebP with good quality
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },
  markdown: {
    remarkPlugins: [
      remarkGfm,
      [
        remarkWikiLink,
        {
          pageResolver: (name) => [slugifyNoteName(name)],
          hrefTemplate: (permalink) => `/apps/msc-cogsci/notes/${permalink}`,
          aliasDivider: "|",
          wikiLinkClassName: "wiki-link",
          newClassName: "wiki-link-new",
        },
      ],
    ],
    rehypePlugins: [rehypeMermaidDual],
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ["mermaid"],
    },
    shikiConfig: {
      themes: {
        light: "github-light-high-contrast",
        dark: "vesper",
      },
      defaultColor: false, // Use CSS variables instead of inline colors
    },
  },
});
