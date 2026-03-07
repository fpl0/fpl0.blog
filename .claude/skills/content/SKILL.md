---
name: content
description: Manage blog content — create posts/apps, publish, unpublish, list, delete. Use when the user wants to scaffold, publish, unpublish, list, or delete blog posts or apps.
---

# Content Management

Wraps the `0:*` content management scripts in `scripts/`.

## Available Commands

| Command | What it does | Interactive? |
|---------|-------------|--------------|
| `bun run 0:new-post` | Scaffold a new blog post (prompts for title, slug, summary, tags) | Yes |
| `bun run 0:new-app` | Scaffold a new app entry (prompts for title, slug, summary, tags) | Yes |
| `bun run 0:list` | List all content entries | No |
| `bun run 0:list --drafts` | List only drafts | No |
| `bun run 0:list --published` | List only published entries | No |
| `bun run 0:publish <slug>` | Publish a draft (sets isDraft: false, commits, pushes) | No |
| `bun run 0:publish <slug> --no-push` | Publish without pushing | No |
| `bun run 0:unpublish <slug>` | Revert to draft | No |
| `bun run 0:delete <slug>` | Permanently delete a content entry | No |
| `bun run 0:help` | Show all available commands | No |

## Rules

1. **Interactive scripts** (`new-post`, `new-app`) read from stdin — run them via Bash and let the user interact directly. Do NOT try to pipe input.
2. **Non-interactive scripts** (`list`, `publish`, `unpublish`, `delete`) can be called directly.
3. The `publish` command auto-commits and pushes by default. Use `--no-push` if the user only wants a local commit.
4. The `delete` command is destructive — always confirm with the user before running it.
5. All content lives in `src/content/blog/<slug>/` (posts) or `src/content/apps/<slug>/` (apps).
6. New posts are created as drafts (`isDraft: true`). They won't appear on the site until published.

## Content Structure

- Blog posts: `src/content/blog/<slug>/index.mdx` (MDX with frontmatter)
- Apps: `src/content/apps/<slug>/index.md` + optional `App.astro` component
- Schema enforced by `src/content/config.ts` (Zod validation)

## Workflow

Typical content lifecycle:
1. `bun run 0:new-post` — scaffold
2. Write content in the generated `index.mdx`
3. `bun run 0:list --drafts` — verify it shows up
4. `bun run 0:publish <slug>` — publish, commit, push
