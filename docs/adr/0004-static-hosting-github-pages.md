# ADR-0004: Static hosting, GitHub Pages by default

- Status: Accepted (owner may override) · Date: 2026-11-09

## Context

The output is a static `dist/`. The owner already uses both GitHub Pages and Vercel.

## Decision

Ship a GitHub Actions workflow that runs checks, refreshes the snapshot, builds,
and deploys to GitHub Pages. Vite uses `base: './'` so the same build also
works on Vercel, Netlify, or a custom domain without changes.

## Consequences

- ➕ Free, lives next to the code, and a scheduled run keeps the data fresh.
- ➖ If the repo is named `metalpadawan.github.io` the site lives at the root;
  any other name serves it under `/<repo>/`. Relative base handles both.
