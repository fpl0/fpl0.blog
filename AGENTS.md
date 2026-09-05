## Conventions

Content is plain `.md` only — no MDX. All CSS is hand-written in `src/styles/global.css`;
no UI frameworks, no Tailwind. See `README.md` for the writing and deploy workflow.
Publish: merge to main = automated deploy; emergency-only manual for break-glass. See **Deploying** in `README.md`.

For content bar, seed ritual, and drafting rules, see `WRITING.md`. `ideas.md` and
`templates/` live outside `src/content/` on purpose — they are not part of the
Astro content collection and must never be placed under it (the collection glob is
`**/*.md`). Real drafts go in `src/content/blog/` with `draft: true`. Frontmatter uses
`date` (not `pubDate`).

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styling](https://docs.astro.build/en/guides/styling/)
