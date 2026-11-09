# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.1] - 2026-11-09

### Fixed

- Dead "Live demo" links (4) are detected at snapshot time and hidden; re-checked daily.
- `team11-wdd330` and similar names now tagged _Coursework_.
- Content no longer invisible for visitors without JavaScript.
- No re-animation flicker or cut-off stat counters when live data arrives.
- Repos beyond the first 100 are no longer dropped.
- Enter in the search box applies the search immediately.
- Avatar URL and snapshot path handling made robust.

### Changed

- Performance: removed per-frame backdrop blur, capped the background at ~60 fps, no GPU reallocation on mobile
  URL-bar resize, CSS fallback on machines without GPU acceleration.
- Accessibility: project cards are named by their headings.

## [0.1.0] - 2026-11-09

### Added

- Project documentation: spec, plan, architecture, ADRs 0001–0005, conventions, AI context file (`CLAUDE.md`), dev log.
- Portfolio page listing every public repo of `metalpadawan` (21 shown; the profile-README repo is excluded).
- Build-time snapshot with README excerpts (`npm run snapshot`) plus live GitHub API refresh with session cache.
- Search, category and language filters, sorting, and shareable URL state.
- Featured section (pinned projects, then live demos), hero stats, skills, contact links.
- WebGL2 background: domain-warped fBm nebula (low-res FBO), composite pass, 16k curl-noise GPU particles
  with pointer and scroll interaction, adaptive quality governor.
- Reduced-motion support, hidden-tab pause, WebGL context-loss recovery, CSS gradient fallback.
- Card 3D tilt and cursor spotlight, reveal-on-scroll, stat count-up.
- CI workflow (check + build) and GitHub Pages deploy workflow with daily snapshot refresh.

### Fixed

- Snapshot script no longer overwrites good data when the GitHub API rate-limits mid-run.
