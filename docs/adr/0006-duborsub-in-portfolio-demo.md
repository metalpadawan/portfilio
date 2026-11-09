# ADR-0006: Dub or Sub? as an in-portfolio interactive demo

- Status: Accepted · Date: 2026-11-09 · Chosen by the owner

## Context

The owner made `metalpadawan/duborsub` private and asked for a live demonstration on the portfolio
instead of a link to the code. Discovery (DEVLOG Step 10):

- Dub or Sub? (internally "AniRate") is full stack: Next.js 15 client (React Query + axios), NestJS API,
  PostgreSQL via Prisma, email confirmation, admin moderation. It has never been deployed (no domain configured).
- Its catalogue (38,009 titles) is derived from **anime-offline-database** (ODbL 1.0 + DbCL 1.0), enriched with
  AniList metadata. Ratings, dub reports and notes are user-generated, and none exist publicly yet.

Options considered:

1. **Deploy the real app.** Most faithful, but it needs a paid server, a domain and an email provider on the owner's accounts.
2. **Static-export the real Next.js frontend against a mocked API.** It would mean changing the private repo, and
   a Next.js build is heavy (the dev machine had under 1 GB of free RAM).
3. **Rebuild a focused demo inside the portfolio** in AniRate's own design system. Free, ships today, and the code stays private.

The owner chose option 3.

## Decision

- A second Vite page, `demos/duborsub/`, written in vanilla TypeScript, implementing the app's core loop:
  catalogue search (English, romaji, Japanese), sort and genre tabs, the sub/dub **Measure** and verdict, the work
  page with distributions, **Rating Tiles**, dub reports (three put a dub on record) and title requests.
- **Data:** a ~240-title sample of the real catalogue, generated once by `scripts/build-duborsub-sample.ts` from the
  owner's local copy and committed. It is credited and kept under the ODbL as the licence requires.
- **No fabricated data presented as real:** sub/dub ratings and dub status are deterministic _illustrative sample
  values_, labelled on every surface ("Sample" tag plus a persistent banner), following AniRate's own design rule for demo
  titles. Visitor ratings and reports are stored only in their browser and update the figures live.
- The portfolio card shows **Live demo** plus a "Private source" badge, with no repo link. A `showcase` entry in
  `config.ts` keeps it listed even though the public GitHub API no longer returns the repo.

## Consequences

- ➕ A working demo today at no cost, with no server to maintain, and the source stays private.
- ➕ It reuses the portfolio's tooling, tests and CI.
- ➖ It is a re-implementation: the demo can drift from the real app's UI over time.
- ➖ No real community data until the real app is deployed. Revisit with option 1 later; the card's demo link can then point to the real site.
