/**
 * Dub or Sub? demo: pure model (ADR-0006, SPEC F11–F13). No DOM, no storage; unit-tested.
 *
 * `describeSplit` and the format labels are ported from the real app (frontend/src/lib/scores.ts)
 * so the demo states every comparison exactly as the app does.
 */

// ---------- Types ----------

export interface Title {
  id: number;
  rank: number;
  title: string; // romaji (ODbL catalogue)
  english: string | null;
  native: string | null;
  synonyms: string[];
  format: string;
  episodes: number | null;
  season: string | null;
  year: number | null;
  studio: string | null;
  genres: string[];
  cover: string | null;
}

export type Version = 'sub' | 'dub';
export type Score = 1 | 2 | 3 | 4 | 5;
/** Votes per score, index 0 = score 1 … index 4 = score 5. */
export type Distribution = [number, number, number, number, number];

export interface Measure {
  average: number | null;
  count: number;
  distribution: Distribution;
}

export interface TitleStats {
  sub: Measure;
  dub: Measure;
  dubOnRecord: boolean;
  dubReports: number;
}

export interface VisitorState {
  ratings: Record<string, { sub?: Score; dub?: Score }>;
  reports: number[];
  requests: { title: string; note: string; at: string }[];
}

export const DUB_THRESHOLD = 3;
export const PAGE_SIZE = 24;

// ---------- The split (ported from the real app) ----------

export type Lead = 'sub' | 'dub' | 'even' | null;

export interface Split {
  sub: number | null;
  dub: number | null;
  lead: Lead;
  gap: number | null;
  /** Short form for lists, e.g. "Dub +0.5", "Sub only", "Unrated". */
  tag: string;
}

export function describeSplit(subRating?: number | null, dubRating?: number | null): Split {
  const sub = typeof subRating === 'number' ? subRating : null;
  const dub = typeof dubRating === 'number' ? dubRating : null;

  if (sub !== null && dub !== null) {
    const gap = Math.round((dub - sub) * 10) / 10;
    if (gap === 0) return { sub, dub, lead: 'even', gap: 0, tag: 'Even' };
    const lead = gap > 0 ? 'dub' : 'sub';
    return {
      sub,
      dub,
      lead,
      gap: Math.abs(gap),
      tag: `${lead === 'dub' ? 'Dub' : 'Sub'} +${Math.abs(gap).toFixed(1)}`,
    };
  }
  if (sub !== null) return { sub, dub, lead: null, gap: null, tag: 'Sub only' };
  if (dub !== null) return { sub, dub, lead: null, gap: null, tag: 'Dub only' };
  return { sub, dub, lead: null, gap: null, tag: 'Unrated' };
}

/** The work page's verdict sentence, worded as in the real app. */
export function verdictSentence(split: Split, dubOnRecord: boolean): string {
  if (split.lead === 'sub' || split.lead === 'dub') {
    return `The ${split.lead} leads by ${(split.gap ?? 0).toFixed(1)}.`;
  }
  if (split.lead === 'even') return 'Sub and dub are level. Either is a safe choice.';
  if (split.sub !== null) {
    return dubOnRecord
      ? 'Only the sub has ratings so far. Rate the dub to settle it.'
      : 'Only the sub has ratings so far. If you watched a dub, report it to settle it.';
  }
  if (split.dub !== null) return 'Only the dub has ratings so far. Rate the sub to settle it.';
  return 'No ratings yet. Be the first to rate either version.';
}

export function formatScore(value: number | null): string {
  return value === null ? '—' : value.toFixed(1);
}

const FORMAT_LABELS: Record<string, string> = {
  TV: 'TV',
  MOVIE: 'Movie',
  OVA: 'OVA',
  ONA: 'Web series',
  SPECIAL: 'Special',
};
export function formatLabel(format: string | null | undefined): string {
  return format ? (FORMAT_LABELS[format] ?? format) : '';
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`;
}

export function displayTitle(t: Pick<Title, 'english' | 'title'>): string {
  return t.english?.trim() || t.title;
}

// ---------- Illustrative sample ratings (labelled as sample data in the UI) ----------

/** mulberry32: small, fast, deterministic PRNG. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw `count` votes clustered around `mean` (1..5) so the distribution and average agree. */
function drawVotes(rand: () => number, count: number, mean: number): Distribution {
  const dist: Distribution = [0, 0, 0, 0, 0];
  for (let i = 0; i < count; i++) {
    // Triangular noise of ±1.5 around the mean, rounded to a score.
    const value = mean + (rand() + rand() - 1) * 1.5;
    const score = Math.min(5, Math.max(1, Math.round(value)));
    dist[score - 1] = (dist[score - 1] ?? 0) + 1;
  }
  return dist;
}

export function measureFrom(distribution: Distribution): Measure {
  const count = distribution.reduce((a, b) => a + b, 0);
  if (count === 0) return { average: null, count: 0, distribution };
  const sum = distribution.reduce((acc, n, i) => acc + n * (i + 1), 0);
  return { average: Math.round((sum / count) * 10) / 10, count, distribution };
}

/**
 * Deterministic, illustrative stats for a title. Same id → same numbers on every visit.
 * Popular titles (low rank) get more votes and are more likely to have a dub on record.
 */
export function sampleStats(title: Pick<Title, 'id' | 'rank'>): TitleStats {
  const rand = prng(title.id * 2654435761);
  const popularity = Math.max(0.15, 1 - title.rank / 300); // 1 → ~0.2
  const subCount = Math.round(4 + popularity * 46 * (0.6 + rand() * 0.8));
  const subMean = 3.3 + rand() * 1.4;
  const dubOnRecord = rand() < 0.45 + popularity * 0.4;
  const sub = measureFrom(drawVotes(rand, subCount, subMean));

  if (!dubOnRecord) {
    return {
      sub,
      dub: measureFrom([0, 0, 0, 0, 0]),
      dubOnRecord: false,
      dubReports: Math.floor(rand() * DUB_THRESHOLD), // 0..2
    };
  }
  const dubCount = Math.round(subCount * (0.25 + rand() * 0.6));
  const dubMean = Math.min(4.9, Math.max(1.8, subMean + (rand() - 0.6) * 1.6));
  return {
    sub,
    dub: measureFrom(drawVotes(rand, dubCount, dubMean)),
    dubOnRecord: true,
    dubReports: DUB_THRESHOLD,
  };
}

/** Sample stats with the visitor's own ratings and dub report folded in. */
export function withVisitor(stats: TitleStats, id: number, visitor: VisitorState): TitleStats {
  const mine = visitor.ratings[String(id)] ?? {};
  const reported = visitor.reports.includes(id);
  const dubReports = stats.dubOnRecord
    ? stats.dubReports
    : Math.min(DUB_THRESHOLD, stats.dubReports + (reported ? 1 : 0));
  const dubOnRecord = stats.dubOnRecord || dubReports >= DUB_THRESHOLD;

  const add = (m: Measure, score: Score | undefined): Measure => {
    if (!score) return m;
    const next = [...m.distribution] as Distribution;
    next[score - 1] = (next[score - 1] ?? 0) + 1;
    return measureFrom(next);
  };
  return {
    sub: add(stats.sub, mine.sub),
    dub: dubOnRecord ? add(stats.dub, mine.dub) : stats.dub,
    dubOnRecord,
    dubReports,
  };
}

export function emptyVisitor(): VisitorState {
  return { ratings: {}, reports: [], requests: [] };
}

/** Validate untrusted JSON from localStorage into a VisitorState. */
export function parseVisitor(raw: unknown): VisitorState {
  const out = emptyVisitor();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  const isScore = (v: unknown): v is Score => v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
  if (r['ratings'] && typeof r['ratings'] === 'object') {
    for (const [id, value] of Object.entries(r['ratings'] as Record<string, unknown>)) {
      if (!/^\d+$/.test(id) || !value || typeof value !== 'object') continue;
      const v = value as Record<string, unknown>;
      const entry: { sub?: Score; dub?: Score } = {};
      if (isScore(v['sub'])) entry.sub = v['sub'];
      if (isScore(v['dub'])) entry.dub = v['dub'];
      if (entry.sub || entry.dub) out.ratings[id] = entry;
    }
  }
  if (Array.isArray(r['reports'])) {
    out.reports = r['reports'].filter((n): n is number => Number.isInteger(n)).slice(0, 500);
  }
  if (Array.isArray(r['requests'])) {
    out.requests = r['requests']
      .filter(
        (q): q is { title: string; note: string; at: string } =>
          !!q &&
          typeof q === 'object' &&
          typeof (q as Record<string, unknown>)['title'] === 'string' &&
          typeof (q as Record<string, unknown>)['note'] === 'string' &&
          typeof (q as Record<string, unknown>)['at'] === 'string',
      )
      .slice(0, 50);
  }
  return out;
}

// ---------- Search, sort, filter, page ----------

/** Case-, accent- and punctuation-insensitive; keeps Japanese and other scripts. */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function matches(t: Title, query: string): boolean {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalize(
    [t.title, t.english ?? '', t.native ?? '', ...t.synonyms, t.studio ?? ''].join(' '),
  );
  const compact = haystack.replace(/ /g, '');
  return terms.every((term) => haystack.includes(term) || compact.includes(term));
}

export type SortKey = 'popularity' | 'rating' | 'votes' | 'year' | 'title';
export const SORTS: readonly { key: SortKey; label: string }[] = [
  { key: 'popularity', label: 'Popular' },
  { key: 'rating', label: 'Top rated' },
  { key: 'votes', label: 'Most votes' },
  { key: 'year', label: 'Newest' },
  { key: 'title', label: 'Title' },
];

export interface Row {
  title: Title;
  stats: TitleStats;
  split: Split;
}

const leading = (s: Split): number => Math.max(s.sub ?? -1, s.dub ?? -1);

export function sortRows(rows: readonly Row[], key: SortKey): Row[] {
  const byRank = (a: Row, b: Row): number => a.title.rank - b.title.rank;
  const cmp: Record<SortKey, (a: Row, b: Row) => number> = {
    popularity: byRank,
    rating: (a, b) => leading(b.split) - leading(a.split) || byRank(a, b),
    votes: (a, b) =>
      b.stats.sub.count + b.stats.dub.count - (a.stats.sub.count + a.stats.dub.count) ||
      byRank(a, b),
    year: (a, b) => (b.title.year ?? 0) - (a.title.year ?? 0) || byRank(a, b),
    title: (a, b) =>
      displayTitle(a.title).localeCompare(displayTitle(b.title), 'en', { sensitivity: 'base' }),
  };
  return [...rows].sort(cmp[key]);
}

export function topGenres(titles: readonly Title[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const t of titles) for (const g of t.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([g]) => g);
}

export function paginate<T>(
  items: readonly T[],
  page: number,
  size = PAGE_SIZE,
): { items: T[]; page: number; pages: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: items.slice((current - 1) * size, current * size), page: current, pages };
}

// ---------- Routing (hash, so the demo works on any static host) ----------

export type Route =
  | { view: 'collection'; q: string; sort: SortKey; genre: string | null; page: number }
  | { view: 'work'; id: number }
  | { view: 'request' };

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#/, '');
  const work = /^\/work\/(\d+)$/.exec(h);
  if (work) return { view: 'work', id: Number(work[1]) };
  if (h === '/request') return { view: 'request' };
  const params = new URLSearchParams(h.split('?')[1] ?? '');
  const sort = params.get('sort');
  return {
    view: 'collection',
    q: params.get('q') ?? '',
    sort: SORTS.find((s) => s.key === sort)?.key ?? 'popularity',
    genre: params.get('genre') || null,
    page: Math.max(1, Number(params.get('page')) || 1),
  };
}

export function collectionHash(state: {
  q: string;
  sort: SortKey;
  genre: string | null;
  page: number;
}): string {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.sort !== 'popularity') params.set('sort', state.sort);
  if (state.genre) params.set('genre', state.genre);
  if (state.page > 1) params.set('page', String(state.page));
  const s = params.toString();
  return s ? `#/?${s}` : '#/';
}
