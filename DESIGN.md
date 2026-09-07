# Design system — fpl0.blog

Source of truth: [`src/styles/global.css`](./src/styles/global.css)  
Live: [fpl0.io](https://www.fpl0.io/)

This kit is **for this blog only**. Other products get their own systems. Hand-written CSS — no Figma, no Storybook, no component package.

## Tokens

All color tokens use `light-dark()` on `:root` (`color-scheme: dark` by default). `data-theme` is `light` | `dark` on `:root` (theme toggle).

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--bg` | `#fbfbf9` | `#16161a` | Page surface |
| `--fg` | `#16161a` | `#e2e0db` | Primary text |
| `--muted` | `#6d6a72` | `#94919a` | Secondary text / chrome |
| `--rule` | `#e5e2dc` | `#2b2b31` | Hairlines, borders |
| `--rule-strong` | `#c9c5bd` | `#43434b` | Stronger rules (dense leaders) |
| `--accent` | `#24509b` | `#8fb1ea` | Azulejo cobalt — punctuation only |
| `--code-bg` | `#f3f1ec` | `#1e1e24` | Inline code + code blocks |
| `--measure` | `66ch` | same | Prose column |
| `--gutter` | `1.25rem` | same | Page inset |
| `--step-0` | `clamp(1.1875rem, 1.1rem + 0.4vw, 1.3125rem)` | same | Body (19px → 21px) |
| `--font-serif` | Source Serif 4 | same | Body / display |
| `--font-mono` | JetBrains Mono | same | Chrome, meta, code |

Derived mixes (not separate tokens): `color-mix(in oklab, …)` for selection, muted foreground, and link underlines.

## Usage rules

1. **Accent is punctuation, never fills.** Brand/masthead dots, draft-badge stroke, focus ring, hovers, selection tint. No solid accent buttons or filled chrome.
2. **Serif owns reading; mono owns chrome.** Body, headings, prose → `--font-serif`. Nav, brand, byline, dates, frontmatter, badges, hr ornaments, code → `--font-mono`.
3. **One column.** `.wrap` centers content at `max-inline-size: calc(43.5rem + 2 * var(--gutter))` (≈66ch of serif at the 21px ceiling). Use rem for the wrap max-width so mono chrome matches serif measure. Prose itself caps at `--measure`.
4. **Type stays quiet.** Body via `--step-0`; headings in `em` so they track the fluid base. Old-style figures in prose; lining tabular figures in mono, code, and tables.
5. **Theme is a preference, not a skin.** Dark is the default. The toggle cycles dark ↔ light only — no system theme, no OS-follow path. `data-theme` is `light` | `dark`. FOUC boot: anything other than `light` in localStorage → dark. Toggle `aria-label` is the next action only (`Use light theme` / `Use dark theme`); no `aria-pressed`. `theme-color` is a solid value from the current theme.
6. **Motion is optional.** Smooth scroll and theme-icon spin only under `prefers-reduced-motion: no-preference`.
7. **Focus is always accent.** `:focus-visible` → 2px `var(--accent)` outline, 2px offset, 2px radius. Do not invent a second focus style.

## Patterns

These exist in CSS today (class names are the contract):

| Pattern | Notes |
| --- | --- |
| `.wrap` | Centered column + gutter padding |
| `.site-header` / nav / `#theme-toggle` | Mono brand (`.dot` accent); muted nav → `--fg` on hover; ghost toggle → accent on hover |
| `.site-footer` | Mono muted; hairline via `::before` inset by gutter (text column, not padding box) |
| `.masthead` / `.byline` | Display serif + accent full stop; mono muted byline |
| `.posts.sparse` / `.posts.dense` | Sparse: stacked title/desc/time. Dense: flex row + dotted `--rule-strong` leader (accent on hover); stacks below 480px |
| `.draft-badge` | Mono, accent text + 1px `currentColor` border, 3px radius |
| `.post-header` / `.fm` | Balanced h1; YAML frontmatter in mono (`.fm-key` muted) |
| `.prose` | Measure, pretty wrap, hanging punctuation; accent-tint link underlines; blockquote rule; mono `* * *` hr; scrollable tables; code on `--code-bg` (Shiki colors only — surface stays `--code-bg`) |
| `:focus-visible` / `.sr-only` | Accessibility primitives already in the kit |

## Gaps (blog UX only)

Tighten later if these ship or hurt:

1. **Dense archive on small screens** — leaders hide; re-check spacing / tap feel.
2. **Code block overflow** — horizontal scroll exists; no scroll cue or copy affordance.
3. **Footnote back-links** — verify return-link hit area if footnotes grow.

Do **not** add Button / Input / Field / Dialog / Toast here unless the blog itself needs them. Other products own their own kits.
