# Engineering Conventions

## Code

- **TypeScript strict**, no `any`. Prefer `type`-only imports where possible.
- **Pure core, thin shell:** business logic lives in pure functions (`github/normalize`,
  `projects/*`, `bg/quality`) that are unit-tested. DOM, network and GPU code stays thin.
- **Small modules** (< ~200 lines), one responsibility each; names say what they do.
- **No `innerHTML` with external data.** Use `el()` from `ui/dom.ts` / `textContent`.
- **Fail soft:** network and GPU failures degrade gracefully, never blank the page.
- **Accessibility is a feature:** semantic HTML first, ARIA only when needed,
  respect `prefers-reduced-motion`, keep visible focus.
- Formatting is owned by Prettier; lint rules by ESLint. Don't argue style in review.

## Git

- **Conventional Commits:** `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `ci:`, `style:`.
  Example: `feat(bg): add adaptive quality governor`.
- Branch per change: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`. `main` is always deployable.
- Small commits; each one passes `npm run check`.
- **Semantic Versioning** in `package.json`; notable changes go in `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com)).

## Documentation (every step is documented)

| When                         | Update                                                     |
| ---------------------------- | ---------------------------------------------------------- |
| Any work session / step      | Append to `docs/DEVLOG.md`: what, why, how it was verified |
| Significant technical choice | New ADR in `docs/adr/`                                     |
| User-visible change          | `CHANGELOG.md` under _Unreleased_                          |
| Requirement change           | `docs/SPEC.md` (keep IDs stable)                           |
| Structure change             | `docs/ARCHITECTURE.md`                                     |

## Definition of Done

1. `npm run check` passes (typecheck + lint + format check + tests).
2. `npm run build` succeeds.
3. Keyboard and reduced-motion behavior checked for UI changes.
4. DEVLOG + CHANGELOG updated.

## AI-assisted ("vibe") coding rules

1. **Spec before prompt:** the agent works from `docs/SPEC.md` and `docs/PLAN.md`, not vibes alone.
2. **Context file:** `CLAUDE.md` holds project rules, so every session starts aligned.
3. **Small, verifiable steps:** one phase or task at a time, gated by `npm run check`.
4. **Human reviews the diff:** AI output is a draft until it is read and understood.
5. **Tests pin behavior:** pure logic gets tests, so AI refactors can't silently break it.
6. **Log decisions, not just code:** ADRs and the DEVLOG record why, which helps future prompts.
7. **Never paste secrets** into prompts or code; the site needs no tokens at runtime.
