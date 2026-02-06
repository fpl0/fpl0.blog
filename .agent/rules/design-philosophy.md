---
description: Complete visual identity and design system for fpl0.blog. All agents MUST follow these specifications exactly.
globs:
  - "**/*"
alwaysApply: true
---

# Design Philosophy: "The Digital Antiquarian"

This document is the SINGLE SOURCE OF TRUTH for this project's visual identity. Every UI element, component, and page MUST adhere to these specifications. Do not deviate. Do not improvise.

---

## 1. Typography System

### Font Stacks (Use ONLY These)

| Variable | Font | Usage |
|----------|------|-------|
| `--font-sans` | `Inter Variable`, system-ui | Body UI, summaries, navigation labels |
| `--font-serif` | `Merriweather` | **Primary reading font**: Headings, article prose, blockquotes |
| `--font-mono-brand` | `Space Mono` | Brand elements: Logo, dates, metadata, error codes (`404`) |
| `--font-mono` | `JetBrains Mono` | Code blocks, inline code, technical content |

### Type Scale (Strict Minor Third - 1.200)

**Framework:** Linear Interpolation (`slope * vw + intercept`) anchored to strict pixel values.

- **Mobile Base:** `16px` (1rem)
- **Desktop Base:** `17px` (1.0625rem)

```css
  /* Base: 16px (1rem) -> 17px (1.0625rem) range */
  --font-size-base: clamp(1rem, 0.11vw + 0.96rem, 1.0625rem);

  /* Heading Scale - Minor Third (1.2) */
  --font-size-h1: clamp(1.728rem, 0.20vw + 1.66rem, 1.836rem); /* 27.65px -> 29.38px */
  --font-size-h2: clamp(1.44rem, 0.16vw + 1.39rem, 1.53rem);   /* 23.04px -> 24.48px */
  --font-size-h3: clamp(1.2rem, 0.14vw + 1.15rem, 1.275rem);   /* 19.20px -> 20.40px */
  --font-size-body: var(--font-size-base);
  --font-size-lead: 1.35rem;

  /* UI Scale */
  --font-size-sm: 0.9375rem;
  --font-size-xs: 0.875rem;
```

### Line Heights

| Variable | Value | Usage |
|----------|-------|-------|
| `--line-height-tight` | 1.1 | Headings |
| `--line-height-snug` | 1.25 | Subheadings |
| `--line-height-normal` | 1.5 | UI text |
| `--line-height-relaxed` | 1.6 | Body default (Strict Density) |
| `--line-height-loose` | 1.7 | Long-form prose |

---

## 2. Color System (HSL-Based, Warm Palette)

### Dark Mode (Default - "The Archive")

```css
/* Backgrounds - Warm charcoal, NOT cold gray */
--color-bg: hsl(20, 15%, 8%);
--color-surface: hsl(20, 12%, 12%);
--color-surface-raised: hsl(20, 10%, 16%);
--color-highlight: hsl(35, 20%, 14%);

/* Text - Warm off-white, NOT pure white */
--color-text: hsl(35, 12%, 87%);
--color-text-secondary: hsl(30, 8%, 68%);
--color-text-muted: hsl(25, 6%, 52%);

/* Accents */
--color-primary: hsl(42, 52%, 76%);       /* Gold / Cream */
--color-primary-dim: hsl(42, 35%, 58%);
--color-accent-cool: hsl(180, 20%, 72%);  /* Teal for inline code */

/* Borders & Shadows */
--color-border: hsl(20, 10%, 18%);
--color-border-subtle: hsl(20, 8%, 14%);
--shadow-color: rgba(10, 5, 0, 0.6);
```

### Light Mode ("The Parchment")

```css
/* Backgrounds - Warm cream paper, NOT pure white */
--color-bg: hsl(45, 40%, 96%);
--color-surface: hsl(45, 30%, 92%);
--color-surface-raised: hsl(45, 25%, 88%);
--color-highlight: hsl(45, 45%, 90%);

/* Text - Deep sepia-brown, NOT pure black */
--color-text: hsl(25, 30%, 18%);
--color-text-secondary: hsl(25, 25%, 35%);
--color-text-muted: hsl(25, 20%, 50%);

/* Accents */
--color-primary: hsl(28, 80%, 38%);       /* Deep Amber */
--color-primary-dim: hsl(28, 60%, 48%);
--color-accent-cool: hsl(180, 30%, 35%);  /* Deep Teal */

/* Borders & Shadows */
--color-border: hsl(35, 25%, 82%);
--color-border-subtle: hsl(35, 20%, 88%);
--shadow-color: rgba(60, 40, 20, 0.12);
```

> **CRITICAL**: NEVER use `#FFFFFF`, `#000000`, `white`, or `black`. Always use the CSS variables above.

---

## 3. Layout & Spacing

### Content Width
- **Max-width**: `72ch` for body content ("Density" Standard).
- **Prose max-width**: `72ch` for paragraphs.
- **Padding**: `4rem 1.5rem` (desktop), `1.5rem 0.75rem` (mobile < 600px).

### Spacing System (Strict 4px/8px Grid)
All spacing MUST be integer multiples of `0.25rem` (4px).

- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-3`: 0.75rem (12px)
- `--space-4`: 1rem (16px)
- ...
- `--space-6`: 1.5rem (24px) - *Baseline heartbeat*

### Margin Patterns
- **Headings**: `margin-top: 3rem`, `margin-bottom: 1rem`.
- **Paragraphs**: `margin-bottom: 1.5em` (Strict Density).
- **Code blocks / Figures**: `margin: 2.5rem 0`.

---

## 4. Component Patterns

### The Logo / Brand Mark

```css
.logo {
  font-family: var(--font-mono-brand);
  font-size: 2.2rem;
  font-weight: 500;
  letter-spacing: -0.04em;
  display: flex;
  align-items: baseline;
}
```

### The Living Cursor (`_`)

The blinking underscore is the brand's signature. It MUST be implemented exactly as follows:

```css
.cursor {
  display: inline-block;
  color: var(--color-primary);
  margin-left: 0.05em;
  width: 0.6em;              /* Fixed width prevents layout shift */
  text-align: center;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

### Links

```css
a {
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--color-muted);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

a:hover {
  color: var(--color-primary);
  text-decoration-color: var(--color-primary);
}
```

### Blockquotes

```css
blockquote {
  border-left: 2px solid var(--color-primary);
  padding-left: 1.5rem;
  font-family: var(--font-serif);
  font-style: italic;
  color: var(--color-muted);
}

blockquote cite {
  font-family: var(--font-mono-brand);
  font-size: var(--font-size-xs);
  letter-spacing: 0.05em;
  color: var(--color-primary);
  font-style: normal;
}
```

### Code Blocks

- **Background**: `var(--color-surface)` (wrapper has `border: 1px solid var(--color-border)`).
- **Font**: `var(--font-mono)`, `font-size: var(--font-size-xxs)`.
- **Border-radius**: `8px` on wrapper, `6px` on buttons.
- **Inline code**: `background: var(--color-surface)`, `color: var(--color-accent-cool)`.

### Buttons / Interactive Elements

- **Border**: `1px solid var(--color-border)`.
- **Hover**: `background: var(--color-highlight)`, `color: var(--color-primary)`.
- **Transition**: `all 0.2s ease`.
- **Border-radius**: `4px` - `6px` depending on context.

---

## 5. Animation & Motion

### Standard Transition
```css
transition: all 0.2s ease;
/* OR for smoother feel */
transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
```

### View Transitions
```css
animation-duration: 0.2s;
animation-timing-function: ease-out;
```

### Reduced Motion
ALWAYS include:
```css
@media (prefers-reduced-motion: reduce) {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

---

## 6. Strict Rules

1. **NEVER use emojis.** Use SVGs or CSS shapes.
2. **NEVER use pure white or pure black.** Use the warm palette variables.
3. **NEVER add arbitrary font sizes.** Use the type scale variables.
4. **NEVER add borders without using `var(--color-border)`.**
5. **NEVER add shadows without using `var(--shadow-color)`.**
6. **ALWAYS use `var(--font-serif)` for headings and prose.**
7. **ALWAYS use `var(--font-mono-brand)` for metadata, dates, and system labels.**
8. **ALWAYS ensure hover states use `var(--color-primary)`.**
9. **ALWAYS use smooth transitions (0.2s minimum).**
10. **ALWAYS support both light and dark themes via CSS variables.**
