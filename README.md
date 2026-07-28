# fpl0.io

A blog. Astro, one folder of plain Markdown, a few hundred lines of hand-written CSS, Cloudflare Pages.

## Writing a post

Create a Markdown file in `src/content/blog/`:

```markdown
---
title: The title
description: One sentence for the list page, RSS, and search engines.
date: 2026-07-28
---

The post.
```

Optional frontmatter: `updated: 2026-08-01` (shows an "updated" date), `draft: true`
(visible in `npm run dev`, never built for production). The filename becomes the URL:
`my-post.md` → `fpl0.io/posts/my-post/`.

Commit, push, published. Nothing else.

You can also point Obsidian (or iA Writer) at `src/content/blog/` — or symlink it into a
vault — and write there.

## Development

```bash
npm run dev       # dev server (drafts visible)
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

Frontmatter is validated by the Zod schema in `src/content.config.ts` — a typo in a date
fails the build instead of shipping a broken post.

## Deploying (Cloudflare Pages)

One-time setup, Git-connected (recommended):

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Framework preset **Astro**; build command `npm run build`; output directory `dist`.
   Node version is picked up from `.nvmrc`.
4. **Custom domains** → add `fpl0.io`.

After that, every push to `main` deploys. PRs get preview URLs automatically.

Direct upload without Git (also works): `npm run deploy` (uses `wrangler pages deploy`;
first run will prompt to log in and create the project).

`public/_headers` sets immutable caching for hashed assets and a few security headers.
If old URLs ever need redirecting, add a `public/_redirects` file
(`/old-path /posts/new-slug/ 301`, one per line).

## Where things live

- `src/content/blog/` — the writing (plain `.md` only, deliberately: no MDX)
- `src/content.config.ts` — frontmatter schema
- `src/styles/global.css` — all of the CSS; typography lives here
- `src/layouts/BaseLayout.astro` — head/meta, header, footer, theme toggle
- `astro.config.mjs` — fonts, Shiki themes, sitemap, CSS inlining
- `src/assets/fonts/` — Source Serif 4 + JetBrains Mono, latin-subset variable WOFF2,
  instanced to the wght 400–700 range the CSS uses (full optical-size axis kept).
  To regenerate: run `fontTools.varLib.instancer` with `wght=400:700` on the Fontsource
  `opsz` builds for Source Serif 4 (the default `wght`-only builds drop the optical-size
  axis) and the `wght` build for JetBrains Mono — the exact source files are named in
  `astro.config.mjs`

Later, if publishing from a phone starts to matter: add Keystatic. It commits Markdown
back to this repo, so the files-and-git workflow keeps working unchanged.
