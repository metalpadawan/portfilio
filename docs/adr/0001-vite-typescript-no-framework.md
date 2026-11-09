# ADR-0001: Vite + TypeScript, no UI framework

- Status: Accepted · Date: 2026-11-09

## Context

The site is one page with roughly 20 cards, a few controls and a canvas. A
portfolio is judged on load speed and polish. A framework runtime (React ~45 kB
gzip) would be most of the JS budget (< 60 kB, see SPEC NFR).

## Decision

Use Vite as the bundler and dev server and TypeScript in `strict` mode. Write the
DOM with a tiny typed `el()` helper. Test with Vitest, which reuses Vite's config.

## Consequences

- ➕ Very small bundle, instant HMR, no framework churn.
- ➕ Vitest, ESLint and Prettier are standard, well-documented tooling.
- ➖ No component model, so re-rendering is manual (acceptable at this size).
- Revisit if the site grows into multiple pages or a blog.
