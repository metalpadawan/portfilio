import { describe, expect, it } from 'vitest';
import {
  DUB_THRESHOLD,
  collectionHash,
  describeSplit,
  emptyVisitor,
  matches,
  measureFrom,
  normalize,
  paginate,
  parseRoute,
  parseVisitor,
  sampleStats,
  sortRows,
  verdictSentence,
  withVisitor,
  type Row,
  type Title,
} from '../src/demos/duborsub/model';
import sample from '../src/demos/duborsub/data/sample.json';

function title(overrides: Partial<Title> = {}): Title {
  return {
    id: 1,
    rank: 1,
    title: 'Shingeki no Kyojin',
    english: 'Attack on Titan',
    native: '進撃の巨人',
    synonyms: ['AoT'],
    format: 'TV',
    episodes: 25,
    season: 'SPRING',
    year: 2013,
    studio: 'WIT STUDIO',
    genres: ['Action'],
    cover: null,
    ...overrides,
  };
}

describe('describeSplit (ported from the real app)', () => {
  it('states the leader and gap', () => {
    expect(describeSplit(4.1, 4.6)).toMatchObject({ lead: 'dub', gap: 0.5, tag: 'Dub +0.5' });
    expect(describeSplit(4.6, 4.1)).toMatchObject({ lead: 'sub', tag: 'Sub +0.5' });
  });
  it('handles even, single-version and unrated', () => {
    expect(describeSplit(4.0, 4.04).tag).toBe('Even');
    expect(describeSplit(4.2, null).tag).toBe('Sub only');
    expect(describeSplit(null, 3.9).tag).toBe('Dub only');
    expect(describeSplit(null, null).tag).toBe('Unrated');
  });
  it('words the verdict sentence like the app', () => {
    expect(verdictSentence(describeSplit(4.1, 4.6), true)).toBe('The dub leads by 0.5.');
    expect(verdictSentence(describeSplit(4, 4), true)).toBe(
      'Sub and dub are level. Either is a safe choice.',
    );
    expect(verdictSentence(describeSplit(null, null), false)).toBe(
      'No ratings yet. Be the first to rate either version.',
    );
  });
});

describe('sample stats', () => {
  const titles = (sample as { items: Title[] }).items;

  it('is deterministic per title', () => {
    const first = titles[0];
    if (!first) throw new Error('sample is empty');
    expect(sampleStats(first)).toEqual(sampleStats(first));
  });

  it('keeps every average consistent with its distribution', () => {
    for (const t of titles) {
      const s = sampleStats(t);
      for (const m of [s.sub, s.dub]) {
        expect(measureFrom(m.distribution)).toEqual(m);
        expect(m.count).toBe(m.distribution.reduce((a, b) => a + b, 0));
        if (m.average !== null) {
          expect(m.average).toBeGreaterThanOrEqual(1);
          expect(m.average).toBeLessThanOrEqual(5);
        }
      }
      if (!s.dubOnRecord) {
        expect(s.dub.count).toBe(0);
        expect(s.dubReports).toBeLessThan(DUB_THRESHOLD);
      }
    }
  });

  it('gives a realistic mix: some dubs on record, some not, some leads each way', () => {
    const stats = titles.map(sampleStats);
    const onRecord = stats.filter((s) => s.dubOnRecord).length;
    expect(onRecord).toBeGreaterThan(titles.length * 0.4);
    expect(onRecord).toBeLessThan(titles.length * 0.95);
    const leads = stats.map((s) => describeSplit(s.sub.average, s.dub.average).lead);
    expect(leads).toContain('sub');
    expect(leads).toContain('dub');
  });
});

describe('visitor actions', () => {
  const base = sampleStats({ id: 42, rank: 100 });

  it('folds a visitor rating into the distribution and average', () => {
    const v = { ...emptyVisitor(), ratings: { '42': { sub: 5 as const } } };
    const merged = withVisitor(base, 42, v);
    expect(merged.sub.count).toBe(base.sub.count + 1);
    expect(merged.sub.distribution[4]).toBe(base.sub.distribution[4] + 1);
  });

  it('puts a dub on record when the visitor report reaches the threshold', () => {
    const stats = { ...base, dubOnRecord: false, dubReports: DUB_THRESHOLD - 1 };
    const before = withVisitor(stats, 42, emptyVisitor());
    expect(before.dubOnRecord).toBe(false);
    const after = withVisitor(stats, 42, { ...emptyVisitor(), reports: [42] });
    expect(after.dubOnRecord).toBe(true);
    expect(after.dubReports).toBe(DUB_THRESHOLD);
  });

  it('ignores a dub rating while no dub is on record', () => {
    const stats = { ...base, dubOnRecord: false, dubReports: 0 };
    const v = { ...emptyVisitor(), ratings: { '42': { dub: 4 as const } } };
    expect(withVisitor(stats, 42, v).dub.count).toBe(0);
  });

  it('validates untrusted stored state', () => {
    const parsed = parseVisitor({
      ratings: { '7': { sub: 4, dub: 9 }, abc: { sub: 3 }, '8': 'x' },
      reports: [1, 'two', 3.5, 4],
      requests: [{ title: 'Mushishi', note: '', at: '2026-01-01' }, { title: 5 }],
    });
    expect(parsed.ratings).toEqual({ '7': { sub: 4 } });
    expect(parsed.reports).toEqual([1, 4]);
    expect(parsed.requests).toHaveLength(1);
    expect(parseVisitor(null)).toEqual(emptyVisitor());
  });
});

describe('search, sort and paging', () => {
  const t = title();

  it('matches English, romaji, Japanese and synonyms, ignoring case/accents/punctuation', () => {
    expect(matches(t, 'attack titan')).toBe(true);
    expect(matches(t, 'SHINGEKI')).toBe(true);
    expect(matches(t, '進撃')).toBe(true);
    expect(matches(t, 'aot')).toBe(true);
    expect(matches(t, 'naruto')).toBe(false);
    expect(normalize('Pokémon: Ash’s Journey!')).toBe('pokemon ash s journey');
    expect(matches(title({ english: 'Re:Zero' }), 'rezero')).toBe(true);
  });

  it('sorts by rating, votes, year and title', () => {
    const row = (id: number, rank: number, sub: number | null, year: number, name: string): Row => {
      const stats = sampleStats({ id, rank });
      return {
        title: title({ id, rank, year, english: name }),
        stats,
        split: describeSplit(sub, null),
      };
    };
    const rows = [
      row(1, 3, 4.1, 2010, 'beta'),
      row(2, 1, 4.8, 2020, 'Alpha'),
      row(3, 2, null, 2015, 'gamma'),
    ];
    expect(sortRows(rows, 'popularity').map((r) => r.title.id)).toEqual([2, 3, 1]);
    expect(sortRows(rows, 'rating').map((r) => r.title.id)).toEqual([2, 1, 3]);
    expect(sortRows(rows, 'year').map((r) => r.title.id)).toEqual([2, 3, 1]);
    expect(sortRows(rows, 'title').map((r) => r.title.id)).toEqual([2, 1, 3]);
  });

  it('clamps pages', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect(paginate(items, 1, 24)).toMatchObject({ page: 1, pages: 3 });
    expect(paginate(items, 99, 24).page).toBe(3);
    expect(paginate(items, 3, 24).items).toEqual([48, 49]);
    expect(paginate([], 1).pages).toBe(1);
  });
});

describe('routing', () => {
  it('parses work, request and collection routes with safe defaults', () => {
    expect(parseRoute('#/work/16498')).toEqual({ view: 'work', id: 16498 });
    expect(parseRoute('#/request')).toEqual({ view: 'request' });
    expect(parseRoute('')).toEqual({
      view: 'collection',
      q: '',
      sort: 'popularity',
      genre: null,
      page: 1,
    });
    expect(parseRoute('#/?sort=evil&page=-3')).toMatchObject({ sort: 'popularity', page: 1 });
  });

  it('round-trips collection state through the hash', () => {
    const state = { q: 'one piece', sort: 'votes' as const, genre: 'Action', page: 2 };
    expect(parseRoute(collectionHash(state))).toEqual({ view: 'collection', ...state });
    expect(collectionHash({ q: '', sort: 'popularity', genre: null, page: 1 })).toBe('#/');
  });
});
