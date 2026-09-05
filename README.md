# fpl0.io

This is my personal blog. The posts are Markdown files in a folder, built with Astro and
hosted on Cloudflare Pages. Nothing here is meant to be reusable by anyone else; the notes
below are so I remember how it works when I come back to it in six months.

## Writing a post

Copy `templates/blog-post.md` into `src/content/blog/` (always start with `draft: true`).
See `WRITING.md` for the shippable-idea bar, weekly seed ritual, and prompts. Seeds live
in `ideas.md` at the repo root — not under `src/content/`, so they never publish.

```markdown
---
title: The title
description: One sentence for the list page, RSS, and search engines.
date: 2026-07-28
draft: true
---

The post.
```

`updated: 2026-08-01` shows an "updated" date. `draft: true` keeps a post visible in
`npm run dev` but out of production builds. Frontmatter uses `date` (not `pubDate`).
The filename becomes the URL, so `my-post.md` lives at `fpl0.io/posts/my-post/`. Prefer
`YYYY-MM-DD-short-slug.md` when useful; a short slug is fine if the date prefix would
block drafting. Frontmatter `date` is the chronology source of truth.

Frontmatter is validated against the Zod schema in `src/content.config.ts`, so a typo in a
date fails the build rather than shipping a broken post.

Obsidian and iA Writer both work if I point them at `src/content/blog/` or symlink it into
a vault.

## Commands

```bash
npm run dev       # dev server, drafts visible
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run test      # run smoke tests (requires build first)
npm run deploy    # emergency-only manual deploy (use CI/CD instead)
```

## Testing

The project includes smoke tests that verify core functionality:
- Homepage loads and displays content correctly
- Blog posts render with proper structure and metadata
- 404 page works
- RSS feed is valid XML

To run tests locally:

```bash
npm run build    # build the site first
npm test         # run tests against the preview server
```

The tests use Playwright and run automatically in CI on every push and pull request.

## Deploying

Production deploys run automatically via GitHub Actions when code is merged to `main`.
After the build, audit, and Playwright smoke tests pass, the workflow deploys to Cloudflare
Pages using wrangler and runs health checks against the live site. The release log is the
Actions run history at https://github.com/fpl0/fpl0.blog/actions.

**Secrets required** (already configured in repository settings):
- `CLOUDFLARE_API_TOKEN` — API token with Pages edit permissions
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID

The Cloudflare Pages project is **not** connected to GitHub in the Cloudflare dashboard,
so deploys only happen through the CI/CD workflow.

**Emergency manual deploy:** If the CI/CD pipeline is down, you can run `npm run deploy`
locally, but this should only be used as a last resort. The automated workflow is the
primary deployment path.

`public/_headers` handles immutable caching for hashed assets, security headers, and a
hash-based Content-Security-Policy. If either inline script in `BaseLayout.astro` changes,
the CSP hash has to be recomputed (`sha256` of the exact script body, base64) or the theme
toggle stops working. Old URLs can be redirected with a `public/_redirects` file, one
`/old-path /posts/new-slug/ 301` per line.

## Where things live

- `DESIGN.md` — design system documentation (tokens, usage rules, patterns)
- `src/content/blog/` — the writing, plain `.md` only, no MDX
- `ideas.md` — one-line post seeds (not published; outside the content collection)
- `templates/blog-post.md` — draft template (copy into `src/content/blog/`; not under the collection)
- `WRITING.md` — shippable-idea bar, prompts, and weekly ritual
- `src/content.config.ts` — frontmatter schema
- `src/styles/global.css` — all of the CSS, including typography
- `src/layouts/BaseLayout.astro` — head/meta, header, footer, theme toggle
- `astro.config.mjs` — fonts, Shiki themes, sitemap, CSS inlining
- `src/assets/fonts/` — Source Serif 4 and JetBrains Mono, latin-subset variable WOFF2,
  instanced to the wght 400–700 range the CSS uses, with the optical-size axis kept. To
  regenerate, run `fontTools.varLib.instancer` with `wght=400:700` on the Fontsource
  `opsz` builds for Source Serif 4 (the plain `wght` builds drop the `opsz` axis) and the
  `wght` build for JetBrains Mono. The exact source files are named in `astro.config.mjs`.
