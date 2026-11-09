# Specification — metalpadawan Portfolio

> Status: **Approved for build (v0.1)** · Owner: metalpadawan · Last updated: 2026-11-09

## 1. Goal

A single-page portfolio that shows **every public GitHub project** owned by
[`metalpadawan`](https://github.com/metalpadawan). It sits on top of an
**advanced, GPU-driven animated background**. The site should feel premium and
still load fast, stay accessible, and keep working when the GitHub API is
unavailable.

## 2. Users & jobs-to-be-done

| User                       | Job                                                                  |
| -------------------------- | -------------------------------------------------------------------- |
| Recruiter / hiring manager | Scan what I have built, open live demos, judge breadth in under 60 s |
| Fellow developer           | Find a repo by language or keyword, jump to source                   |
| Me (owner)                 | Add a repo on GitHub and see it appear without editing the site      |

## 3. Functional requirements

| ID  | Requirement                                                                                                                                                                                                                                                   | Priority |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| F1  | List **all** public repos for the configured user (forks shown with a badge; the profile-README repo is excluded via config)                                                                                                                                  | Must     |
| F2  | Each card shows: name, description (falls back to a README excerpt), primary language with color dot, last-updated date, stars, topics, links to **Source** and **Live demo** (homepage or GitHub Pages URL; dead links detected at snapshot time are hidden) | Must     |
| F3  | Live data: fetch the GitHub REST API at runtime; on failure or rate limit, fall back to a build-time snapshot                                                                                                                                                 | Must     |
| F4  | Search box (name, description, topics, language), filter chips by language and category, sort by recently updated / name / created                                                                                                                            | Must     |
| F5  | Categories derived by rules (e.g. `wdd*` / `cse*` → _Coursework_; has live demo → _Live_)                                                                                                                                                                     | Should   |
| F6  | Hero with name, tagline, avatar, GitHub stats (repo count, languages, years active)                                                                                                                                                                           | Must     |
| F7  | Featured section: projects with a live deployment, most recent first                                                                                                                                                                                          | Should   |
| F8  | Owner-editable `src/config.ts` for name, tagline, exclusions, title + description overrides, featured pins                                                                                                                                                    | Must     |
| F9  | Deep-linkable filter state via URL query (`?q=&lang=&cat=&sort=`)                                                                                                                                                                                             | Could    |

## 4. Background animation requirements

| ID  | Requirement                                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | WebGL2 multi-pass renderer: domain-warped fractal noise "nebula" rendered to a low-resolution framebuffer, upscaled, then composited with a GPU particle field |
| B2  | 10k+ particles animated entirely in the vertex shader (stateless, no per-frame CPU loops) following a curl-noise flow                                          |
| B3  | Interactive: particles are repelled or swirled by the pointer, and the nebula shifts with scroll (parallax)                                                    |
| B4  | Adaptive quality governor: measures frame time and scales resolution and particle count up or down to hold ~60 fps                                             |
| B5  | Pauses when the tab is hidden; resumes cleanly                                                                                                                 |
| B6  | `prefers-reduced-motion: reduce` → render one static frame, no motion                                                                                          |
| B7  | No WebGL2 → CSS animated-gradient fallback; the site stays fully usable                                                                                        |
| B8  | Handles `webglcontextlost` / `restored` without crashing                                                                                                       |

## 5. Non-functional requirements

| Area            | Target                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Performance     | Lighthouse Performance ≥ 90 on desktop; JS bundle < 60 kB gzip; no layout shift from cards loading (CLS < 0.05)                                                                  |
| Accessibility   | WCAG 2.2 AA: contrast ≥ 4.5:1 for text over the background (scrim), full keyboard navigation, visible focus, semantic landmarks, `aria-live` result count                        |
| Security        | All repo text inserted via `textContent` / DOM APIs (never `innerHTML` with API data); external links use `rel="noopener noreferrer"`; strict CSP-compatible (no inline scripts) |
| Resilience      | Works offline-ish from the snapshot; API errors are surfaced quietly, never as a blank page                                                                                      |
| Maintainability | TypeScript `strict`; pure logic unit-tested; ESLint + Prettier clean; CI gate on every push                                                                                      |
| Compatibility   | Last 2 versions of Chrome, Edge, Firefox, Safari; 375 px → 1920 px widths, no horizontal scroll                                                                                  |

## 6. Out of scope (v0.1)

- Blog / CMS, contact form backend, private repos, i18n, analytics.

## 7. Open questions for the owner

1. ~~**Display name and tagline.**~~ Resolved: taken from the public profile README (`metalpadawan/metalpadawan`). Edit in `src/config.ts`.
2. **Hosting target.** The plan defaults to GitHub Pages through Actions. The build is a static `dist/`, so Vercel works too.
3. **Coursework visibility.** All coursework (`wdd*`, `cse*`) is shown, tagged as _Coursework_. Say so if you'd rather hide some of it.
4. **Repo descriptions.** Most repos have no description. The site falls back to README excerpts. Adding descriptions on GitHub (or overrides in config) will improve the cards a lot.
