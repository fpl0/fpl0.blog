# fpl0.io

This is my personal blog. The posts are Markdown files in a folder, built with Astro and
hosted on Cloudflare Pages. Nothing here is meant to be reusable by anyone else; the notes
below are so I remember how it works when I come back to it in six months.

## Writing a post

Add a Markdown file to `src/content/blog/`:

```markdown
---
title: The title
description: One sentence for the list page, RSS, and search engines.
date: 2026-07-28
---

The post.
```

`updated: 2026-08-01` shows an "updated" date. `draft: true` keeps a post visible in
`npm run dev` but out of production builds. The filename becomes the URL, so
`my-post.md` lives at `fpl0.io/posts/my-post/`.

Frontmatter is validated against the Zod schema in `src/content.config.ts`, so a typo in a
date fails the build rather than shipping a broken post.

Obsidian and iA Writer both work if I point them at `src/content/blog/` or symlink it into
a vault.

## Commands

```bash
npm run dev       # dev server, drafts visible
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run deploy    # build and upload to Cloudflare Pages
```

## Deploying

### Deploy runbook

**Prerequisites:**
- Node.js >=22.12 installed
- Logged into wrangler as `me@fpl0.io` (check with `npx wrangler@4 whoami`, login if needed)
- Local checkout of the repo

**Deploy command:**

```bash
npm run deploy
```

This builds the site and uploads to the Cloudflare Pages project `fpl0`.

**Important:** CI on GitHub Actions is a merge gate only — green checks verify the build works
and tests pass, but do not publish anything. Passing CI does not mean the site is live. Deploy
manually with the command above.

**Post-deploy checks:**
1. Homepage loads: https://www.fpl0.io/ (or https://fpl0.io/) returns 200
2. Pick one known published post and confirm it loads
3. RSS feed is valid: https://www.fpl0.io/rss.xml returns 200

**Ownership:** Robert (Blog Manager) owns the publish path and wrangler auth. Escalate any
requests to reconnect Pages to Git or add CI auto-deploy workflows to Tech Lead before
changing.

**Rollback:** Check out a known-good commit locally and run `npm run deploy` from that
checkout. There's no Git-connected Pages rollback UI since the project isn't connected to GitHub.

### Configuration notes

The project is not connected to GitHub, so pushing to `main` does not publish anything on
its own; I have to run the deploy. (Connecting it to Git in the Cloudflare dashboard would
change that, if I ever want push-to-deploy and preview URLs.)

`public/_headers` handles immutable caching for hashed assets, security headers, and a
hash-based Content-Security-Policy. If either inline script in `BaseLayout.astro` changes,
the CSP hash has to be recomputed (`sha256` of the exact script body, base64) or the theme
toggle stops working. Old URLs can be redirected with a `public/_redirects` file, one
`/old-path /posts/new-slug/ 301` per line.

## Where things live

- `src/content/blog/` — the writing, plain `.md` only, no MDX
- `src/content.config.ts` — frontmatter schema
- `src/styles/global.css` — all of the CSS, including typography
- `src/layouts/BaseLayout.astro` — head/meta, header, footer, theme toggle
- `astro.config.mjs` — fonts, Shiki themes, sitemap, CSS inlining
- `src/assets/fonts/` — Source Serif 4 and JetBrains Mono, latin-subset variable WOFF2,
  instanced to the wght 400–700 range the CSS uses, with the optical-size axis kept. To
  regenerate, run `fontTools.varLib.instancer` with `wght=400:700` on the Fontsource
  `opsz` builds for Source Serif 4 (the plain `wght` builds drop the `opsz` axis) and the
  `wght` build for JetBrains Mono. The exact source files are named in `astro.config.mjs`.
