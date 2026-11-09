# Project Plan

> Each phase ends with a **verification gate**: nothing moves forward until the
> gate passes, and every phase gets a DEVLOG entry plus a CHANGELOG line.

## Phase 0: Discovery ✅

- Inventory the environment (Node, npm, git) and the GitHub account (22 public repos).
- Capture findings in `docs/DEVLOG.md` (Step 0).
- **Gate:** repo inventory recorded; data shape understood.

## Phase 1: Planning & documentation ✅

- `docs/SPEC.md`: requirements with IDs (F*, B*, NFRs).
- `docs/ARCHITECTURE.md`: modules, data flow, render pipeline.
- `docs/adr/`: one Architecture Decision Record per significant choice.
- `docs/CONVENTIONS.md`: code style, commits, branching, definition of done.
- `CLAUDE.md`: context and rules for AI pair-programming sessions.
- `README.md`, `CHANGELOG.md`, `docs/DEVLOG.md`.
- **Gate:** every requirement maps to a phase below.

## Phase 2: Scaffold & tooling ✅

- Vite + TypeScript (strict), ESLint (flat config) + Prettier, Vitest, EditorConfig.
- npm scripts: `dev`, `build`, `preview`, `lint`, `format`, `typecheck`, `test`, `check` (all gates), `snapshot`.
- **Gate:** `npm run check` passes on an empty app.

## Phase 3: Data layer (F1, F2, F3, F5, F8) ✅

- `scripts/fetch-repos.mjs`: build-time snapshot including README excerpts → `src/data/repos.json`.
- `src/github/normalize.ts`: raw API → `Project` (pure).
- `src/projects/categorize.ts`: rule-based categories (pure).
- `src/github/api.ts`: runtime fetch → session cache → snapshot fallback.
- **Gate:** unit tests for normalize and categorize; snapshot generated with 21 projects.

## Phase 4: UI shell & project grid (F2, F4, F6, F7, F9) ✅

- Semantic HTML layout: header, hero, featured, all-projects, footer.
- `src/projects/filter.ts`: search, filter, sort (pure, tested).
- `src/ui/*`: safe DOM rendering, controls, URL sync, reveal-on-scroll, card tilt and spotlight.
- **Gate:** keyboard-only walkthrough works; filter tests pass; no `innerHTML` with API data.

## Phase 5: Advanced background (B1–B8) ✅

- `src/bg/gl.ts` helpers, GLSL shaders, `renderer.ts` multi-pass pipeline.
- `quality.ts` adaptive governor (pure, tested).
- Reduced-motion, visibility pause, context-loss handling, CSS fallback.
- **Gate:** steady ~60 fps on desktop; static frame under reduced motion; fallback verified by forcing WebGL off.

## Phase 6: Hardening & delivery ✅ (deploy pending: needs a GitHub remote)

- Accessibility pass (contrast scrim, focus, landmarks, live region).
- Performance pass (bundle size, lazy avatar, `content-visibility`).
- CI workflow (`check` + `build`) and GitHub Pages deploy workflow with a scheduled snapshot refresh.
- **Gate:** `npm run check && npm run build` green; production preview reviewed.

## Phase 7: Dub or Sub? demo (F10–F13, ADR-0006) ✅

1. **Data:** `scripts/build-duborsub-sample.ts` builds a ~240-title sample (most popular TV/movies with covers) from the
   owner's local catalogue, plus AniList English/Japanese titles and genres, into `src/demos/duborsub/data/sample.json`,
   with the ODbL credit embedded.
2. **Pure model** (`src/demos/duborsub/model.ts`, tested): verdict (leader, gap, wording), deterministic sample ratings
   with consistent distributions, merging visitor ratings, dub-report threshold, search normalisation, sort/filter/page,
   and route parsing.
3. **Views and styles:** AniRate tokens (plaster, ink, Klein; Archivo with width axis; square corners), checklist rows,
   work view, rating tiles, notices, typeset no-cover plate, black-wall colophon with credits.
4. **Portfolio integration:** `showcase` config, `Project.url` nullable plus `privateSource`, a "Private source" badge,
   the internal demo link, and a second Vite entry.
5. **Gate:** `npm run check` green; build emits `demos/duborsub/index.html`; browser QA of search, sort, rate, report,
   request, deep links, 375 px, reduced motion; Lighthouse accessibility on the demo page.

## Requirement traceability

| Req     | Phase | Module                                                                        |
| ------- | ----- | ----------------------------------------------------------------------------- |
| F1–F3   | 3     | `github/*`, `scripts/fetch-repos.mjs`                                         |
| F4, F9  | 4     | `projects/filter.ts`, `ui/controls.ts`                                        |
| F5      | 3     | `projects/categorize.ts`                                                      |
| F6, F7  | 4     | `ui/render.ts`                                                                |
| F8      | 3     | `config.ts`                                                                   |
| B1–B8   | 5     | `bg/*`                                                                        |
| NFRs    | 6     | all                                                                           |
| F10–F13 | 7     | `config.showcase`, `src/demos/duborsub/*`, `scripts/build-duborsub-sample.ts` |
