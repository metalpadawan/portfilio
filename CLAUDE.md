# CLAUDE.md: AI pair-programming context

Portfolio site for GitHub user **metalpadawan**: Vite + TypeScript (strict), no UI
framework, raw WebGL2 animated background, project data from the GitHub API with a
build-time snapshot fallback.

## Read first

- `docs/SPEC.md`: requirements (IDs F*, B*, NFR). Don't add scope that isn't there.
- `docs/PLAN.md`: phases and verification gates.
- `docs/ARCHITECTURE.md`: module map and data/render flow.
- `docs/CONVENTIONS.md`: code, git and documentation rules.

## Commands

- `npm run dev`: dev server
- `npm run check`: typecheck + lint + format check + unit tests (must pass before done)
- `npm run build`: production build to `dist/`
- `npm run snapshot`: refresh `src/data/repos.json` from the GitHub API

## Rules

- Pure logic in `github/normalize`, `projects/*`, `bg/quality` with tests in `tests/`.
- Never use `innerHTML` with API data; use `el()` from `src/ui/dom.ts`.
- Respect `prefers-reduced-motion`; keep the CSS fallback working when WebGL2 is absent.
- After each step: append to `docs/DEVLOG.md`, update `CHANGELOG.md`, add an ADR for real decisions.
- Conventional Commits. No AI co-author trailers in commits or PRs.
- Profile text, exclusions and overrides live in `src/config.ts`. Edit there, not in UI code.
