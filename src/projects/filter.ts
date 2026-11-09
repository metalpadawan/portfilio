import type { Category, FilterState, Project, SortKey } from '../types';

export const SORT_KEYS: readonly SortKey[] = ['updated', 'created', 'name', 'stars'];
export const CATEGORIES: readonly Category[] = ['Live', 'Personal', 'Coursework', 'Fork'];

export const DEFAULT_FILTER: FilterState = {
  query: '',
  language: null,
  category: null,
  sort: 'updated',
};

function matchesQuery(p: Project, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = [p.name, p.title, p.description, p.language ?? '', ...p.topics, ...p.categories]
    .join(' ')
    .toLowerCase();
  return terms.every((t) => haystack.includes(t)); // AND semantics
}

const comparators: Record<SortKey, (a: Project, b: Project) => number> = {
  updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  created: (a, b) => b.createdAt.localeCompare(a.createdAt),
  name: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
  stars: (a, b) => b.stars - a.stars || b.updatedAt.localeCompare(a.updatedAt),
};

/** Pure: search + filter + sort (SPEC F4). Never mutates the input. */
export function applyFilter(projects: readonly Project[], state: FilterState): Project[] {
  return projects
    .filter((p) => matchesQuery(p, state.query))
    .filter((p) => state.language === null || p.language === state.language)
    .filter((p) => state.category === null || p.categories.includes(state.category))
    .sort(comparators[state.sort]);
}

/** Languages present, most common first, ties alphabetical. */
export function languagesOf(projects: readonly Project[]): string[] {
  const counts = new Map<string, number>();
  for (const p of projects)
    if (p.language) counts.set(p.language, (counts.get(p.language) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([l]) => l);
}

/** Featured: pinned names first (in order), then live demos newest first, capped at `limit`. */
export function pickFeatured(
  projects: readonly Project[],
  pinned: readonly string[],
  limit: number,
): Project[] {
  const byName = new Map(projects.map((p) => [p.name, p]));
  const result = pinned.map((n) => byName.get(n)).filter((p): p is Project => p !== undefined);
  const rest = projects
    .filter((p) => p.demoUrl && !result.includes(p) && !p.fork)
    .sort(comparators.updated);
  return [...result, ...rest].slice(0, limit);
}

/** URL query ⇄ filter state (SPEC F9). Unknown/invalid values fall back to defaults. */
export function filterFromQuery(search: string): FilterState {
  const params = new URLSearchParams(search);
  const sort = params.get('sort');
  const cat = params.get('cat');
  return {
    query: params.get('q') ?? '',
    language: params.get('lang') || null,
    category: CATEGORIES.find((c) => c === cat) ?? null,
    sort: SORT_KEYS.find((s) => s === sort) ?? DEFAULT_FILTER.sort,
  };
}

export function filterToQuery(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.language) params.set('lang', state.language);
  if (state.category) params.set('cat', state.category);
  if (state.sort !== DEFAULT_FILTER.sort) params.set('sort', state.sort);
  const s = params.toString();
  return s ? `?${s}` : '';
}
