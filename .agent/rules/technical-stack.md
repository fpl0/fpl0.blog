---
description: Technical stack and tooling requirements for this Astro project.
globs:
  - "**/*"
alwaysApply: true
---

# Technical Stack & Tooling

## Framework & Runtime

- **Framework**: Astro
- **Runtime & Package Manager**: **Bun** (Strictly enforced)
- **Language**: TypeScript / JavaScript (ESNext)

## Commands

| Action | Command |
|--------|---------|
| Install dependencies | `bun install` |
| Run dev server | `bun run dev` |
| Run tests | `bun test` |

## Dependencies Policy

- **Authorization Required**: Never add external npm dependencies unless explicitly asked by the user.
- **Native Utility**: Leverage standard Web APIs and Bun built-ins to solve problems first.
