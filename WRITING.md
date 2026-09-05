# Writing

How posts get from a one-line seed to something worth shipping. Agents: follow this
before drafting or editing content.

## The shippable-idea bar

A post is ready to draft when it clears all of these:

- **One claim.** A single thing that is true that the reader might not already believe.
  Not a topic ("about Kubernetes"); a claim ("most Kubernetes YAML is a symptom of
  unclear ownership").
- **One reader.** A specific person in a specific moment — what they are trying to do
  when they need this.
- **≥1 concrete evidence.** A story, example, number, or experience that makes the claim
  land. Not vibes.
- **5–15 minute read.** Short enough to finish in one sitting; long enough to earn the
  claim.
- **Not hire/SEO-optimized.** No "10 tips", no keyword stuffing, no résumé padding. Write
  for the reader who already cares, not the search engine or a hiring manager.

If it fails the bar, leave it as a seed in `ideas.md` or cut it. Do not force a draft.

## Prompts (pick one)

Use these to turn a seed into an outline before filling the template:

- **A — Claim drill.** State the claim in one sentence. List three objections. Answer the
  strongest one with evidence. Cut the rest.
- **B — Teach-one-thing.** Name the one skill or distinction the reader should leave with.
  Walk through one concrete example that teaches only that.
- **C — Post-mortem lite.** What broke (or almost broke)? What did you believe that was
  wrong? What would you do differently next time — one change, not a manifesto.
- **D — Constraint essay.** Pick a hard limit (time, money, team size, tools). Show how
  the constraint forced a better decision than the unconstrained default.

## Ritual

1. **Weekly (~15 min):** add 3–5 one-line claims to `ideas.md` under Seeds. Do not expand
   them yet.
2. **Pick one seed** that clears the shippable-idea bar.
3. **Run one prompt** (A–D) → rough outline.
4. **Copy** `templates/blog-post.md` into `src/content/blog/` and fill it. Real drafts live
   there with `draft: true` — never put the blank template under the content collection.

### Filename and URL

Frontmatter `date` is the chronology source of truth (not the filename). Prefer
`YYYY-MM-DD-short-slug.md` when useful; `short-slug.md` is fine if a date prefix would
block drafting. Keep the slug readable and claim-ish. The URL is the filename stem:
`/posts/<slug>/` (same rule as in `README.md`). Existing posts without a date prefix are
fine as-is.


## Drafting rules

- Always start with `draft: true`. Drafts show in `npm run dev` but stay out of
  production builds.
- Title should be claim-ish — close to the claim itself, not a clever tease.
- Frontmatter uses `date` (not `pubDate`). That matches the Zod schema in
  `src/content.config.ts`. No other schema fields beyond what the schema already allows
  (`updated`, etc.).
- No hire CTAs, newsletter chrome, or "subscribe / follow me" asides in the body.

`ideas.md` and `templates/` live outside `src/content/` on purpose so the content
collection glob never publishes them. Do **not** put a template under
`src/content/blog/` (e.g. `_template.md`) — `**/*.md` would ingest it.

## Publishing

Turning `draft: false` (or removing it) and pushing to `main` is not enough. The site is
not Git-connected on Cloudflare Pages — you still need `npm run deploy` to build and
upload. See `README.md`.

## Phase 0 done when

These files exist (`ideas.md`, `templates/blog-post.md`, `WRITING.md`, and the README /
AGENTS.md pointers) **and** one real draft has used the template once (even with
`draft: true`). Do not invent a fake draft just to check the box — wait for a real seed.
