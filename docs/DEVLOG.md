# Development Log

Chronological record of every step: **what** was done, **why**, and **how it was verified**.
Newest entries at the bottom.

---

## Step 0: Discovery · 2026-11-09

**What**

- Checked the environment: Node v24.19.0, npm 11.17.0, git 2.55. The `gh` CLI is not installed (not needed; the public REST API is enough).
- Queried `GET /users/metalpadawan` and `GET /users/metalpadawan/repos?per_page=100`.

**Findings**

- 22 public repos, account created 2023-08-22. Profile has no name or bio.
- Languages: JavaScript (9), HTML (6), TypeScript (2), CSS, Python, C#; 3 with no language.
- 1 fork (`wdd330-sleepoutside`). 1 profile-README repo (`metalpadawan`, 3 kB), which will be excluded.
- Live demos: 4 repos have a `homepage` (Vercel / Pages); 9 have GitHub Pages enabled (`has_pages`).
- Almost no repo has a description, so README excerpts are needed (→ ADR-0003).
- Many repos are BYU-I coursework (`wdd*`, `cse*`), so a _Coursework_ category is useful (→ SPEC F5).

**Verification:** raw API output reviewed in terminal.

---

## Step 1: Planning & documentation · 2026-11-09

**What**

- Wrote `docs/SPEC.md` (requirements with IDs), `docs/PLAN.md` (6 phases with gates and a traceability table),
  `docs/ARCHITECTURE.md`, ADRs 0001–0004, `docs/CONVENTIONS.md`, `CLAUDE.md`, `CHANGELOG.md`.

**Why**

- The owner asked for planning and documentation before code, and for every step to be documented.
- An agent context file plus a spec keeps AI-assisted ("vibe") sessions aligned and reviewable.

**Decisions:** ADR-0001 (Vite+TS, no framework), ADR-0002 (raw WebGL2), ADR-0003 (snapshot + live), ADR-0004 (static hosting).

**Verification:** every SPEC requirement appears in the PLAN traceability table.

---

## Step 2: Scaffold & tooling · 2026-11-09

**What**

- `git init -b main`. Added `package.json` scripts (`dev`, `build`, `check`, `snapshot`, …), strict `tsconfig.json`,
  ESLint flat config (`strictTypeChecked` plus a rule banning `innerHTML`/`outerHTML`), Prettier, EditorConfig,
  `.gitattributes` (LF), `.gitignore`.
- Pinned exact dev-dependency versions: Vite 8.3.7, Vitest 5.1.0, ESLint 10.14, typescript-eslint 8.72.1, Prettier 3.9.10.

**Decisions / findings**

- **TypeScript pinned to 6.0.3, not the latest 7.0.2:** typescript-eslint 8.72 supports `typescript <6.1.0`. → ADR-0005.
- `npm audit` reports a moderate ReDoS in `minimatch`, reachable only through the ESLint toolchain (dev-only,
  never shipped to browsers). The suggested "fix" downgrades ESLint, so it is accepted for now and should be re-checked on upgrades.

**Verification:** dependencies installed; versions checked against peer ranges.

---

## Step 3: Data layer · 2026-11-09

**What**

- `src/types.ts`, `src/config.ts` (owner-editable, F8), `src/github/normalize.ts` (pure mapping, URL sanitizing,
  GitHub Pages demo-URL inference, name prettifying), `src/projects/categorize.ts` (F5),
  `src/github/readme.ts` (README → plain-text excerpt), `src/github/api.ts` (live fetch + session cache + pure `mergeRepos`).
- `scripts/fetch-repos.ts`: snapshot generator that Node 24 runs directly as TypeScript and that shares `readme.ts` with the app (ADR-0005).
- Unit tests for normalize, readme, filter, quality governor, stats and merge.

**Findings & fixes**

- Most repos have no GitHub description, so README excerpts help. But several excerpts were course-template
  boilerplate ("WDD 330 Setup Environment", "Run npm install…"). Added a `BOILERPLATE` filter with tests.
- The profile README (`metalpadawan/metalpadawan`) supplied the owner's name, bio, skills and contact links, which
  replaced the placeholder hero text in `config.ts`.
- **Bug found:** a second snapshot run hit the unauthenticated rate limit (60 requests/hour). The script swallowed
  README errors and **silently wrote a degraded snapshot** (13 → 5 excerpts). Fix: any non-404 README failure now
  aborts the run without writing, and prints a rate-limit hint. Re-ran after the limit reset: 22 repos, 7 real excerpts.

**Verification:** 34/34 tests passing on first run; snapshot contents inspected per repo.

---

## Step 4: UI shell & project grid · 2026-11-09

**What**

- `index.html`: semantic landmarks (header/nav, main, sections with `aria-labelledby`, footer), skip link,
  `noscript` fallback, OG meta. Profile text is injected at build time from `config.ts` by a small Vite plugin
  (`html-from-config`, HTML-escaped) so it is in the static HTML for SEO and no-JS visitors.
- `src/ui/dom.ts` (typed `el()` builder plus inline SVG icons, no `innerHTML`), `render.ts`, `controls.ts`
  (search with 120 ms debounce, sort, category and language chips with `aria-pressed`, URL sync via `replaceState`),
  `effects.ts` (IntersectionObserver reveal, delegated 3D tilt + cursor spotlight for fine pointers only, stat count-up).
- `src/main.ts`: renders the snapshot first, then merges live API data; the background is lazy-loaded at idle.
- `src/styles/main.css`: design tokens, responsive grid, reduced-motion overrides.

**Fixes from lint:** ESLint config was being type-checked itself (override replaced `languageOptions`); `$()` lookup
was an unchecked cast, now a runtime `instanceof` check; one void-returning arrow.

**Verification (headless Chromium, `vite preview`)**

- 21 project cards, 4 featured, status "Live from GitHub", canvas sized to viewport, no console errors.
- Coursework chip → 11 results, `?cat=Coursework` in URL; search "react" + Coursework → empty state shown;
  "Clear filters" resets to 21 and returns focus to search; deep link `?lang=HTML&sort=name` → 6 results, sorted, select synced.
- 375 px mobile: no horizontal overflow (`scrollWidth` = 375).

---

## Step 5: WebGL2 background · 2026-11-09

**What**

- Shaders: `fullscreen.vert` (buffer-less triangle), `nebula.frag` (5-octave domain-warped fBm, scroll/pointer
  parallax), `composite.frag` (bilinear upscale, pointer glow, vignette, grain), `particles.vert/.frag`
  (16k stateless particles, curl-noise flow, pointer repel + swirl, twinkle, depth size, additive blending).
- `src/bg/gl.ts` (compile/link/FBO helpers), `src/bg/quality.ts` (pure EMA governor with hysteresis, 4 tiers),
  `src/bg/background.ts` (lifecycle: visibility pause, reduced motion, context loss/restore, resize, CSS fallback).

**Findings & fixes**

- Caught before runtime: two `smoothstep(edge0, edge1, x)` calls had `edge0 > edge1`, which GLSL leaves undefined.
  Rewritten as `1.0 - smoothstep(lo, hi, x)`.
- The first visual pass was too dim, so the nebula's teal/magenta weights and brightness were raised; text contrast is preserved
  by the scrim and the near-solid card surfaces.

**Verification**

- `html.has-webgl` set, canvas rendering.
- Reduced motion (CDP-emulated): **0** animation frames per second, all cards visible immediately, stats show final values.
  Switching the preference off live resumes the loop (exactly one loop: a probe showed the background loop matching the display rate).
- Forced `no-webgl`: CSS gradient fallback renders and the page stays fully usable.

**Note:** headless Chromium rendering WebGL in software at ~200 fps saturated the CPU and slowed `npm run check` to
5+ minutes. Stopping the browser restored normal speed. Close QA browsers before running gates.

---

## Step 6: Polish, CI/CD & docs · 2026-11-09

**What**

- `config.titles` overrides (with a test) for repos whose slugs read poorly (`duborsub` → "Dub or Sub?");
  a description override for `duborsub` (its README excerpt contained an internal note).
- `.github/workflows/ci.yml` (check + build on push/PR) and `deploy.yml` (snapshot refresh → check → build →
  GitHub Pages; daily cron; snapshot failure degrades to the committed data).
- Docs: README, ARCHITECTURE file map, ADR-0005, SPEC open questions updated, PLAN phases marked.
- `.gstack/` (local QA-tool state) added to `.gitignore`.

**Verification:** `npm run check` → 35/35 tests, typecheck, lint and format clean; `npm run build` →
JS 8.9 kB + 5.3 kB (lazy background) gzip, CSS 4.1 kB gzip. Well inside the 60 kB budget.

---

## Step 7: Full audit & fixes (v0.1.1) · 2026-11-09

**Method:** probed every live-demo URL over HTTP, `npm outdated` / `npm audit --omit=dev`, line-by-line review of
all source, then re-verified in a production build with headless Chromium.

**Findings → fixes**

| #   | Finding                                                                                                                                | Fix                                                                                                                                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | 4 of 13 "Live demo" links were dead (404): `uni-project` (Vercel), `cse270-teton2` (empty repo), `cse340` (Node app), `crud-api` (API) | Snapshot now probes each demo URL; 404/410 → `demo_status: 'broken'` → link and _Live_ tag hidden. Inconclusive answers (timeouts, 403, 5xx) keep the link. Re-checked daily by the deploy cron. |
| B   | `team11-wdd330` tagged _Personal_: coursework detection only matched name prefixes                                                     | `isCourseworkName()` matches a course code (prefix + digit) in any name segment                                                                                                                  |
| C   | Reveal animation hid content (opacity 0) whenever CSS loaded, so no-JS visitors saw an invisible hero                                  | Hidden state wrapped in `@media (scripting: enabled)`                                                                                                                                            |
| D   | Live data re-rendered everything ~300 ms after load: cards re-animated, stat count-up cut off                                          | Re-render only when live data differs; revealed cards are remembered by key and reappear without replaying the entrance                                                                          |
| E   | `backdrop-filter: blur()` on ~25 elements over a canvas that changes every frame (blur recomputed per frame)                           | Removed; surface opacity raised 0.78 → 0.86                                                                                                                                                      |
| F   | Mobile URL-bar show/hide changed `innerHeight` → canvas + FBO reallocated mid-scroll                                                   | `shouldResizeCanvas()`: height-only changes under 20% are ignored (CSS stretch is invisible on noise)                                                                                            |
| G   | Render loop uncapped: ~194 fps measured headless; 120–240 fps on high-refresh monitors                                                 | Fixed-grid frame pacing at ~60 fps (`nextFrameDue()`)                                                                                                                                            |
| H   | No-GPU machines (SwiftShader/llvmpipe) ran shaders on the CPU, the cause of the 5-minute `npm run check` in Step 5                     | `isSoftwareRenderer()` → release context, use CSS fallback                                                                                                                                       |
| I   | Comment promised "immediate on Enter"; not implemented                                                                                 | Enter commits the search immediately                                                                                                                                                             |
| J   | `vite.config.ts` read the snapshot relative to the shell's cwd                                                                         | Resolved via `import.meta.url`                                                                                                                                                                   |
| K   | Avatar URL built by appending `&s=320`, which breaks if there's no query string                                                        | `sizedAvatar()` uses the URL API                                                                                                                                                                 |
| L   | Repo lists fetched with `per_page=100` and no pagination; past 100 repos, projects would silently vanish                               | Paginated in both the snapshot script and the runtime fetch                                                                                                                                      |
| M   | Project `<article>`s had no accessible name                                                                                            | `aria-labelledby` → card heading                                                                                                                                                                 |

Also: URL helpers moved to dependency-free `src/github/urls.ts` so the snapshot script can share them (ADR-0005 pattern);
`mergeRepos` forgets a "broken" verdict if the demo URL changed after the snapshot.

**Not changed (by decision):** dev-only `minimatch` advisory (no runtime deps: `npm audit --omit=dev` → 0);
TypeScript 6.0 pin (ADR-0005); `@types/node` kept at 24 to match the Node 24 runtime.

**Verification**

- `npm run check`: 44/44 tests (+9 regression tests), typecheck, lint, format clean. `npm run build` OK, no warnings.
- Snapshot: `⚠ Dead demo links hidden: uni-project, cse270-teton2, cse340, crud-api`, identical to the manual curl probe.
- Production build in headless Chromium: 21 cards, 9 Live-demo buttons, "Live demos" stat = 9, `team11-wdd330` →
  Coursework, 0 unlabeled cards, avatar `…?v=4&s=320`, status "Live from GitHub", 0 console errors.
  Headless renderer reported SwiftShader → page correctly chose the CSS fallback (fix H in action).
- Enter in search → `?q=teton`, 2 results. Built CSS confirmed: hide-before-reveal is inside `@media (scripting:enabled)`,
  zero `backdrop-filter`. (True no-JS load could not be emulated: the QA tool blocks the CDP method.)
- **Not verifiable here:** the WebGL frame cap and resize tolerance on real GPU hardware (headless has no GPU);
  both are covered by unit tests of their pure helpers.
