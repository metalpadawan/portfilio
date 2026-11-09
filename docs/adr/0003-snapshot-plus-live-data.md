# ADR-0003: Build-time snapshot + runtime live data

- Status: Accepted · Date: 2026-11-09

## Context

"Display all my projects" should stay true as new repos are created. The
unauthenticated GitHub API allows only 60 requests per hour per IP, and most of
the owner's repos have no description.

## Decision

- A Node script (`npm run snapshot`) fetches all repos plus a README excerpt for
  each, and writes `src/data/repos.json`. A scheduled CI job refreshes it daily.
- At runtime the page renders the snapshot first, then fetches the repo list
  once (cached in `sessionStorage`) and merges fresh fields over it.
- Any failure keeps the snapshot on screen.

## Consequences

- ➕ Instant first paint, rate-limit proof, and new repos appear without a redeploy.
- ➕ README excerpts fill the missing descriptions without runtime API calls.
- ➖ A repo created since the last snapshot shows without a README excerpt until the next refresh.
