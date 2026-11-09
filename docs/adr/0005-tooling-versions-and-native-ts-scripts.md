# ADR-0005: TypeScript 6.0 pin and native-TS Node scripts

- Status: Accepted · Date: 2026-11-09

## Context

1. The latest TypeScript is 7.0.2, but typescript-eslint 8.72 declares `typescript >=4.8.4 <6.1.0`.
2. The snapshot script needs the same README-excerpt logic as the app, and that logic must be unit-tested once, not twice.

## Decision

- Pin `typescript@6.0.3`, the newest version inside typescript-eslint's supported range. Upgrade to 7.x once
  typescript-eslint supports it.
- Write `scripts/fetch-repos.ts` in TypeScript and run it with plain `node` (native type stripping, Node ≥ 22.18).
  It imports `src/github/readme.ts` directly, with explicit `.ts` extensions (`allowImportingTsExtensions`).
  Shared modules imported by scripts must stay dependency-free and use only erasable TS syntax.

## Consequences

- ➕ One implementation of excerpt extraction, covered by one test suite.
- ➕ No `tsx`/`ts-node` dependency.
- ➖ `engines.node` is `>=22.18.0`. CI uses Node 24.
