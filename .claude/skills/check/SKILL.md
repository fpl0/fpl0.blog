---
name: check
description: Run the full quality gate (type check + Biome lint + design token lint) and report results. Use before committing, after completing a feature, or when the user asks to validate the codebase.
---

# Quality Gate

Run `bun run check` to execute the full quality pipeline:

1. **validate** — `astro check` (TypeScript type checking)
2. **lint** — `biome check .` (linting + formatting)
3. **lint:design** — `bun run scripts/lint-design.ts` (design token enforcement)

## How to Run

```bash
bun run check
```

This runs all three checks sequentially (`validate && lint && lint:design`). If any step fails, the pipeline stops.

## Interpreting Failures

### Type errors (validate)
- Fix in the source `.astro`, `.ts`, or `.tsx` files
- Common: missing props, incorrect types on content collections, unguarded index access (`noUncheckedIndexedAccess` is enabled)

### Biome errors (lint)
- Auto-fixable issues: run `bun run format` first, then re-check
- Manual fixes: unused imports, `noExplicitAny`, `noConsole` (allowed in scripts/ and .astro files via overrides)

### Design token errors (lint:design)
- The Reflection Engine checks CSS for violations of the design system
- Common: hex/hsl colors (must use OKLCH tokens), hardcoded borders (must use `--ui-border`), arbitrary font sizes (must use the type scale), hardcoded shadows (must use `--shadow-*`)
- Exempt a value with `/* token-exempt */` comment — only for truly unique cases like gradients

## When to Run

- Before committing (also enforced by the pre-commit hook)
- After completing a feature or set of changes
- When the user asks to "check", "validate", or "lint" the project
