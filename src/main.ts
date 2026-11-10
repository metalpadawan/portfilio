import './styles/main.css';
import { config } from './config';
import snapshotJson from './data/repos.json';
import { fetchLiveRepos, mergeRepos } from './github/api';
import { normalizeRepo, withShowcase } from './github/normalize';
import { applyFilter, filterFromQuery, languagesOf, pickFeatured } from './projects/filter';
import { computeStats } from './projects/stats';
import type { FilterState, Project, Snapshot, SnapshotRepo } from './types';
import { initControls } from './ui/controls';
import { animateCounters, enableTilt, observeReveal } from './ui/effects';
import {
  renderFeatured,
  renderGrid,
  renderInterests,
  renderSkills,
  renderStats,
} from './ui/render';

const snapshot = snapshotJson as Snapshot;

/** Typed, runtime-checked lookup: fails loudly if index.html and code drift apart. */
function $<T extends HTMLElement = HTMLElement>(
  id: string,
  type: abstract new () => T = HTMLElement as unknown as abstract new () => T,
): T {
  const node = document.getElementById(id);
  if (!(node instanceof type))
    throw new Error(`#${id} missing from index.html or wrong element type`);
  return node;
}

function toProjects(repos: readonly SnapshotRepo[]): Project[] {
  const fromRepos = repos
    .filter((r) => !config.exclude.includes(r.name))
    .map((r) => normalizeRepo(r, r.readme_excerpt, config, r.demo_status));
  return withShowcase(fromRepos, config.showcase);
}

const dom = {
  stats: $('stats'),
  featured: $('featured-grid'),
  grid: $('project-grid'),
  count: $('result-count'),
  empty: $('empty-state'),
  status: $('data-status'),
  skills: $('skills'),
  interests: $('interests'),
};

let projects = toProjects(snapshot.repos);

function renderProjects(state: FilterState): void {
  const visible = applyFilter(projects, state);
  renderGrid(dom.grid, visible);
  dom.empty.hidden = visible.length > 0;
  dom.count.textContent = `Showing ${String(visible.length)} of ${String(projects.length)} projects`;
  observeReveal(dom.grid);
}

function renderAll(state: FilterState, animate: boolean): void {
  renderStats(dom.stats, computeStats(projects, snapshot.user.created_at));
  renderFeatured(dom.featured, pickFeatured(projects, config.featured, config.featuredLimit));
  controls.setLanguages(languagesOf(projects));
  renderProjects(state);
  observeReveal(document);
  if (animate) animateCounters(dom.stats);
}

// --- Boot: snapshot first (instant paint), then live data (ADR-0003) ---
const controls = initControls(
  {
    search: $('search', HTMLInputElement),
    sort: $('sort', HTMLSelectElement),
    languages: $('language-filters'),
    categories: $('category-filters'),
    clear: $('clear-filters', HTMLButtonElement),
  },
  filterFromQuery(location.search),
  renderProjects,
);

renderSkills(dom.skills, config.skills);
renderInterests(dom.interests, config.interests);
renderAll(controls.getState(), true);
enableTilt(dom.grid);
enableTilt(dom.featured);

const snapshotDate = new Date(snapshot.generatedAt).toLocaleDateString('en-US', {
  dateStyle: 'medium',
});
dom.status.textContent = `Snapshot from ${snapshotDate}`;

void fetchLiveRepos(config.username).then((result) => {
  if (result.ok) {
    const next = toProjects(mergeRepos(snapshot.repos, result.repos));
    // Re-render only when live data actually differs: avoids re-animating cards and
    // cutting off the stat count-up ~300 ms after load (audit fix D).
    if (JSON.stringify(next) !== JSON.stringify(projects)) {
      projects = next;
      renderAll(controls.getState(), false);
    }
    dom.status.textContent = 'Live from GitHub';
    dom.status.dataset['state'] = 'live';
  } else {
    dom.status.textContent = `Showing snapshot from ${snapshotDate}${result.reason === 'rate-limited' ? ' (GitHub rate limit reached)' : ''}`;
    dom.status.dataset['state'] = 'snapshot';
  }
});

// --- Background: loaded after first paint so it never blocks content (SPEC NFR Performance) ---
const canvas = $('bg', HTMLCanvasElement);
const startBackground = (): void => {
  void import('./bg/background').then(({ startBackground: start }) => {
    start(canvas);
  });
};
if ('requestIdleCallback' in window) requestIdleCallback(startBackground, { timeout: 600 });
else setTimeout(startBackground, 200);

$('year').textContent = String(new Date().getFullYear());
