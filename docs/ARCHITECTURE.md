# Architecture

## Overview

A static single-page app built by Vite. No UI framework: the DOM surface is
small, so vanilla TypeScript keeps the bundle tiny (see ADR-0001). Logic is split
into **pure modules** (unit-tested, no DOM or network) and **effectful modules**
(DOM, fetch, WebGL) that stay thin.

```
src/
├── main.ts                 # composition root: wires data → UI → background
├── config.ts               # owner-editable profile + rules (F8)
├── types.ts                # shared domain types
├── data/repos.json         # build-time snapshot (generated)
├── github/
│   ├── api.ts              # effectful: runtime fetch, cache, fallback (F3) + pure mergeRepos
│   ├── normalize.ts        # pure: GitHub API shape → Project (titles, descriptions, demo health)
│   ├── urls.ts             # pure, dependency-free: URL sanitizing, demo URL, demo-status classification
│   └── readme.ts           # pure: README markdown → plain-text excerpt (shared with scripts/)
├── projects/
│   ├── categorize.ts       # pure: rule-based categories (F5)
│   ├── filter.ts           # pure: search / filter / sort (F4)
│   └── stats.ts            # pure: hero stats (F6)
├── ui/
│   ├── dom.ts              # tiny safe element builder + inline SVG icons (no innerHTML)
│   ├── languages.ts        # language → color
│   ├── render.ts           # cards, featured, hero stats, skills
│   ├── controls.ts         # search/filter/sort + URL sync (F9)
│   └── effects.ts          # reveal-on-scroll, card tilt/spotlight, stat count-up
├── bg/                     # lazy-loaded chunk (dynamic import at idle)
│   ├── background.ts       # lifecycle: init, loop, pause, reduced motion, context loss, fallback
│   ├── gl.ts               # WebGL2 helpers (compile, link, FBO, particle seeds)
│   ├── quality.ts          # pure: adaptive quality governor (B4)
│   └── shaders/            # fullscreen.vert, nebula.frag, composite.frag, particles.vert/.frag
└── styles/main.css
index.html                  # semantic shell; %tokens% filled from config.ts by a Vite plugin
scripts/fetch-repos.ts      # snapshot generator (runs as native TS on Node ≥ 22.18, ADR-0005)
tests/*.test.ts             # Vitest unit tests for pure modules
.github/workflows/          # ci.yml (check + build), deploy.yml (snapshot → build → Pages, daily)
```

## Dub or Sub? demo (second page, ADR-0006)

```
demos/duborsub/index.html     # Vite entry 2 (AniRate shell: masthead, sample-data banner, colophon + ODbL credits)
src/demos/duborsub/
├── main.ts                   # hash router (#/?q=&sort=&genre=&page=, #/work/<id>, #/request), focus management
├── model.ts                  # pure: describeSplit (ported from the app), sample stats, visitor merge, search/sort/page
├── views.ts                  # collection, work, request pages
├── ui.ts                     # Measure, distribution, plate, rating tiles, notices
├── store.ts                  # visitor state in localStorage (validated, fails soft)
├── styles.css                # AniRate design system (plaster/ink/Klein, Archivo, square corners)
└── data/sample.json          # 240 titles; built by scripts/build-duborsub-sample.ts from the private repo
```

Private repos are listed through `config.showcase` → `withShowcase()` in `github/normalize.ts`
(`Project.url = null`, `privateSource = true`, same-site demo link).

## Data flow

```
             build time                                   runtime
GitHub API ──► scripts/fetch-repos.mjs ──► repos.json ─┐
  (repos + README excerpts)                            │ fallback
                                                       ▼
GitHub API ──► api.ts ──► sessionStorage cache ──► normalize ──► categorize
                                                                      │
                                       URL query ◄──► controls ──► filter/sort ──► render
```

1. `main.ts` renders the **snapshot right away**, so first paint never waits on the network.
2. `api.ts` fetches `/users/{user}/repos` in the background. Fresh fields (stars,
   dates, new repos) are merged over the snapshot, keyed by repo name. README
   excerpts are kept from the snapshot.
3. On error or HTTP 403/429 (rate limit), the snapshot stays on screen and a quiet
   status note appears.

## Background render pipeline (WebGL2)

```
frame t
 ├─ Pass 1  nebula.frag  → FBO (scale 0.35–0.75 × canvas)   domain-warped fBm, scroll parallax
 ├─ Pass 2  composite    → screen  (bilinear upscale + vignette + film grain)
 └─ Pass 3  particles    → screen  (additive blend, N points; positions computed
                                    in the vertex shader from seed + time + curl noise,
                                    pointer repulsion/swirl uniform)
```

- **Stateless particles:** each vertex holds only a random seed. Position is a
  pure function of `(seed, time, pointer)` in GLSL, so there is no CPU work per
  frame and no transform feedback.
- **Quality governor (`quality.ts`):** keeps an exponential moving average of
  frame time. Above budget it steps down a quality tier (FBO scale, particle
  count, DPR cap). Below budget for a sustained window it steps back up.
  Hysteresis prevents oscillation.
- **Lifecycle:** `visibilitychange` pauses the rAF loop. Reduced motion renders a
  single frame and re-renders only on resize. Context loss cancels the loop, and
  restore rebuilds GPU resources. WebGL2 unavailable → `html.no-webgl` class
  enables the CSS gradient fallback.

## Key types

```ts
interface Project {
  name: string;
  description: string;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  fork: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}
```
