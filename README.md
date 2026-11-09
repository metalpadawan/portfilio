# Emmanuel Asukwo Ndem: Portfolio

Every public project on [github.com/metalpadawan](https://github.com/metalpadawan), pulled live from
the GitHub API and set over a hand-written **WebGL2** background: a domain-warped noise nebula and
16,000 GPU particles that flow, react to the cursor, and shift with scroll.

Vite · TypeScript (strict) · no UI framework · ~14 kB JS gzipped.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command            | What it does                                                                        |
| ------------------ | ----------------------------------------------------------------------------------- |
| `npm run dev`      | Dev server with hot reload                                                          |
| `npm run check`    | Typecheck + lint + format check + unit tests (the "definition of done")             |
| `npm run build`    | Production build to `dist/`                                                         |
| `npm run preview`  | Serve the production build locally                                                  |
| `npm run snapshot` | Refresh `src/data/repos.json` from GitHub (set `GITHUB_TOKEN` to avoid rate limits) |

Requires Node ≥ 22.18 (Node 24 recommended).

## Dub or Sub? demo

[`demos/duborsub/`](demos/duborsub/index.html) is a playable demo of a private full-stack project, built in
that app's own design system with a 240-title sample of its real catalogue (ODbL, credited). Ratings and dub reports
are labelled sample data; visitors' own ratings stay in their browser. See [ADR-0006](docs/adr/0006-duborsub-in-portfolio-demo.md).
Private projects are listed via `showcase` in `src/config.ts`.

## Making it yours

Everything personal lives in [`src/config.ts`](src/config.ts): name, role, tagline, skills, links,
excluded repos, featured pins, and per-repo title or description overrides. No UI code needs to change.

New repos appear automatically: the page fetches the live list on load, and the deploy workflow
refreshes the README-excerpt snapshot daily.

## How it works

- **Data:** a build-time snapshot renders instantly; live API data merges in after load; any API failure
  (including rate limits) keeps the snapshot on screen. → [ADR-0003](docs/adr/0003-snapshot-plus-live-data.md)
- **Background:** three passes per frame: nebula into a low-res framebuffer, composite upscale, additive
  particles computed entirely in the vertex shader. An adaptive governor trades resolution and particle
  count for a steady frame rate. It pauses on hidden tabs, renders one still frame under
  `prefers-reduced-motion`, and falls back to CSS without WebGL2. → [ADR-0002](docs/adr/0002-raw-webgl2-background.md)
- **Safety:** API text is only ever inserted via `textContent` (ESLint bans `innerHTML`), and URLs are sanitized to http(s).

## Deploying

**GitHub Pages:** push to GitHub, then in the repo go to _Settings → Pages → Source: GitHub Actions_.
[`deploy.yml`](.github/workflows/deploy.yml) builds and deploys on every push to `main` and once a day.

**Vercel / Netlify:** framework "Vite", build `npm run build`, output `dist`. The relative `base` works anywhere.

## Documentation

| Doc                                          | Purpose                                               |
| -------------------------------------------- | ----------------------------------------------------- |
| [docs/SPEC.md](docs/SPEC.md)                 | Requirements with IDs                                 |
| [docs/PLAN.md](docs/PLAN.md)                 | Phases, gates, traceability                           |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Module map, data and render flow                      |
| [docs/adr/](docs/adr/)                       | Architecture decision records                         |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md)   | Code, git, documentation and AI-assisted coding rules |
| [docs/DEVLOG.md](docs/DEVLOG.md)             | Every step: what, why, how it was verified            |
| [CHANGELOG.md](CHANGELOG.md)                 | Release notes                                         |
| [CLAUDE.md](CLAUDE.md)                       | Context for AI pair-programming sessions              |
