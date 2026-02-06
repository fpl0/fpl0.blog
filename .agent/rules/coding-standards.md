---
description: Coding standards and CSS guidelines for this project.
globs:
  - "src/**/*.{astro,ts,js,css}"
alwaysApply: true
---

# Coding Standards

## Code Quality

- **Clean & Concise**: Write minimal, efficient code.
- **DRY (Don't Repeat Yourself)**: Extract common logic and styles into reusable components or global CSS variables.
- **Modularity**: Break down complex UI into smaller, focused Astro components.

## CSS Guidelines

- Keep CSS clean, organized, and specifically targeted.
- Prefer standard CSS features over heavy abstractions.
- Ensure responsive design works flawlessly on all devices.
- Use global CSS variables from `src/styles/global.css` for colors, fonts, and spacing.

## Strict Rules

1. **Consistency**: Styles (colors, links, animations) must be uniform across the entire site.
2. **No Emojis**: NEVER USE EMOJIS. Use SVGs or CSS shapes instead.
3. **Strict Aesthetics**: Every new UI/UX implementation must follow the overall aesthetics (colors, typography, measurements).
