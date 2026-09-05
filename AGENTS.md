## Conventions

Content is plain `.md` only — no MDX. All CSS is hand-written in `src/styles/global.css`;
no UI frameworks, no Tailwind. See `README.md` for the writing and deploy workflow.

## Deployment

Production deploys are automated via GitHub Actions (`.github/workflows/ci.yml`). On push
to `main`, after build and audit checks pass, the workflow deploys to Cloudflare Pages
and runs health checks. Manual `npm run deploy` is available for emergencies only.

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
