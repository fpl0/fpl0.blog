# Test Coverage Analysis

## Current State

The codebase has **zero automated test coverage**. There is no test framework installed, no test files, no test scripts in `package.json`, and no test step in the CI/CD pipeline.

Current quality gates consist of:

- **Type checking** via `astro check` (`bun run validate`)
- **Linting and formatting** via Biome (`bun run lint`)
- **Design token linting** via a custom script (`bun run lint:design`)

These catch type errors, style violations, and design system drift, but they cannot verify runtime behavior, logic correctness, or regression safety.

---

## Recommended Test Framework

**Vitest** is the natural fit for this stack:

- Native ESM and TypeScript support (no transpilation config needed)
- Compatible with Bun as a runner (`bunx vitest` or `bun run test`)
- Fast, minimal setup
- Built-in coverage reporting via `@vitest/coverage-v8`

Setup would require adding `vitest` as a dev dependency, creating a minimal `vitest.config.ts`, and adding a `"test"` script to `package.json`.

---

## Priority Areas for Testing

### Priority 1 (High) -- Pure Logic, Zero Dependencies

These modules contain pure functions with no DOM, no Astro runtime, and no file I/O. They are immediately testable with unit tests.

#### 1. Game of Life simulation (`src/content/apps/game-of-life/simulation.ts`)

~113 lines of core algorithmic logic. This is the single most testable module in the codebase.

**What to test:**
- `createGrid(w, h)` -- returns correct dimensions and zeroed `Uint8Array`
- `getCell()` -- toroidal wrapping (negative coordinates, coordinates beyond width/height)
- `setCell()` -- boundary checks, setting alive/dead
- `toggleCell()` -- flips cell state, boundary rejection
- `step()` -- the B3/S23 rules are the heart of the simulation:
  - Dead cell with exactly 3 neighbors becomes alive
  - Live cell with 2 or 3 neighbors survives
  - Live cell with <2 or >3 neighbors dies
  - Verify known stable patterns (block, blinker, glider)
  - Verify `step()` returns a new grid and does not mutate the input
- `clear()` -- all cells become 0
- `randomize()` -- density parameter affects population ratio (statistical test)

**Why this matters:** The simulation rules are easy to get subtly wrong, especially the neighbor counting with toroidal wrapping. A regression here is invisible without tests -- the canvas rendering would just show incorrect behavior.

#### 2. Fuzzy search (`src/utils/search.ts`)

~34 lines, single exported function.

**What to test:**
- Exact substring match returns score > 100
- Longer query relative to text gives higher score (length ratio bonus)
- Fuzzy match where all characters appear in order returns a positive score
- Consecutive character matches score higher than scattered matches
- Partial match (not all query chars found) returns 0
- Case insensitivity
- Empty query / empty text edge cases
- Score ordering: exact match > fuzzy consecutive > fuzzy scattered

**Why this matters:** Search is user-facing. A broken scoring algorithm means users cannot find content on the site.

#### 3. Reading time calculator (`src/utils/content.ts` -- `getReadingTime()`)

**What to test:**
- Plain text at known word count (e.g., 200 words = "1 min read", 400 words = "2 min read")
- Markdown stripping: images, links, headings, inline formatting, code blocks, HTML tags are removed before counting
- Empty string returns `""`
- Minimum is 1 min (never "0 min read")
- Very long content rounds up correctly

**Why this matters:** Displayed on every blog post. Incorrect stripping or rounding would show misleading read times.

---

### Priority 2 (Medium) -- Script Utilities with File I/O

These require either mocking `fs` calls or using a temporary directory, but the logic itself is valuable to test.

#### 4. Slug generation and date formatting (`scripts/base.ts`)

**What to test:**
- `toSlug()` -- lowercases, replaces non-alphanumeric with hyphens, trims leading/trailing hyphens
  - `"Hello World"` -> `"hello-world"`
  - `"  --Weird!!Chars--  "` -> `"weird-chars"`
  - `"already-a-slug"` -> `"already-a-slug"`
- `todayISO()` -- returns `YYYY-MM-DD` format with zero-padded months/days

#### 5. Frontmatter parser (`scripts/base.ts` -- `parseFrontmatter()`)

**What to test:**
- Extracts title, isDraft, createdDate, publicationDate from valid frontmatter
- `isDraft` defaults to `true` when missing
- Returns `null` for files without `---` delimiters
- Handles quoted and unquoted YAML values
- Title defaults to `"(untitled)"` when missing

**Why this matters:** The content management scripts (`publish`, `unpublish`, `list-content`) all depend on `parseFrontmatter()`. A parsing bug could cause silent data loss during publish operations.

#### 6. Content file lookup (`scripts/base.ts` -- `findContentFile()`, `listSlugs()`)

**What to test (with temp directory):**
- `findContentFile()` finds `.mdx` before `.md` in blog dir
- `findContentFile()` falls back to apps dir when slug not in blog
- Returns `null` for nonexistent slugs
- `listSlugs()` returns directory names from both blog and apps dirs
- `listSlugs()` handles missing directories gracefully

---

### Priority 3 (Medium) -- Design System Linter

The design token linter (`scripts/lint-design.ts`) is itself ~482 lines of logic and is a critical quality gate. Testing the linter ensures the linter itself does not have false positives or false negatives.

#### 7. Token registry and violation detection (`scripts/lint-design.ts`)

**What to test:**
- `extractRawVars()` -- correctly parses CSS custom properties from raw CSS strings
- `resolveValue()` -- resolves `var()` references and evaluates basic `calc()` expressions
- `populateRegistry()` -- categorizes tokens into spacing, colors, radius, etc.
- `scanSpacing()` -- detects hardcoded spacing values that match tokens
- `getExcludedLines()` -- correctly excludes `@keyframes`, `@font-face`, and `prefers-reduced-motion` blocks
- `braceBalance()` -- counts open/close braces per line
- `checkMediaQuery()` -- detects media queries with hardcoded breakpoint values

**Why this matters:** This script is the enforcer of the design system. If it has bugs, either invalid code passes (false negatives) or valid code is rejected (false positives, leading to `/* token-exempt */` overuse).

---

### Priority 4 (Lower) -- Rehype Plugin

#### 8. Rehype task list labels (`src/plugins/rehype-task-list-labels.mjs`)

**What to test:**
- Adds `ariaLabel` to checkbox inputs inside `.task-list-item` `<li>` elements
- `textContent()` extracts text recursively from HAST nodes
- Does not modify non-task-list elements
- Handles empty task items (defaults to `"task item"`)

**Why this matters:** This is an accessibility fix. Without tests, a refactor could silently break Lighthouse accessibility scores.

---

### Priority 5 (Future) -- Integration and Build Tests

These are more involved and depend on the Astro build pipeline, but they provide high confidence.

#### 9. RSS feed generation (`src/pages/rss.xml.ts`)

- Verify the feed includes both posts and apps
- Verify items are sorted by date descending
- Verify HTML content is sanitized (no script tags, etc.)

#### 10. Search index generation (`src/pages/search.json.ts`)

- Verify the JSON structure includes title, summary, tags, slug, date, type
- Verify only published (non-draft) content appears

#### 11. Content collection schemas (`src/content/config.ts`)

- Verify summary length validation (50-360 chars)
- Verify `publicationDate >= createdDate` refinement
- Verify the `date` transform computes correctly
- Verify apps schema auto-adds `"app"` tag

---

## CI Integration

Once tests are added, the CI pipeline (`deploy.yml`) should run them before building:

```yaml
- name: Run tests
  run: bun run test

- name: Build site
  run: bun run build
```

And the `check` script in `package.json` should include tests:

```json
"check": "bun run validate && bun run lint && bun run lint:design && bun run test"
```

---

## Summary Table

| Priority | Module | Lines | Complexity | Dependencies |
|----------|--------|-------|------------|--------------|
| 1 | `simulation.ts` (Game of Life) | 113 | High (algorithms) | None |
| 1 | `search.ts` (fuzzy match) | 34 | Medium (scoring) | None |
| 1 | `content.ts` (`getReadingTime`) | 17 | Low (regex + math) | None |
| 2 | `base.ts` (`toSlug`, `todayISO`) | 16 | Low (string ops) | None |
| 2 | `base.ts` (`parseFrontmatter`) | 28 | Medium (YAML parsing) | `fs` (mockable) |
| 2 | `base.ts` (`findContentFile`) | 34 | Medium (file lookup) | `fs` (mockable) |
| 3 | `lint-design.ts` (token linter) | 482 | High (CSS parsing) | `fs` (mockable) |
| 4 | `rehype-task-list-labels.mjs` | 42 | Low (tree walk) | None (HAST) |
| 5 | `rss.xml.ts`, `search.json.ts` | 85 | Medium | Astro runtime |
| 5 | `config.ts` (Zod schemas) | 69 | Medium | Zod |

Starting with Priority 1 modules would cover the most critical logic with the least setup effort.
