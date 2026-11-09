import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTER,
  applyFilter,
  filterFromQuery,
  filterToQuery,
  languagesOf,
  pickFeatured,
} from '../src/projects/filter';
import { project } from './fixtures';

const list = [
  project({
    name: 'b',
    title: 'Beta',
    language: 'TypeScript',
    updatedAt: '2026-03-01',
    stars: 2,
    topics: ['anime'],
  }),
  project({
    name: 'a',
    title: 'alpha',
    language: 'JavaScript',
    updatedAt: '2026-05-01',
    categories: ['Coursework'],
  }),
  project({
    name: 'c',
    title: 'Gamma',
    language: 'JavaScript',
    updatedAt: '2026-01-01',
    demoUrl: 'https://c.dev',
  }),
];

describe('applyFilter', () => {
  it('sorts by updated desc by default and does not mutate input', () => {
    const copy = [...list];
    expect(applyFilter(list, DEFAULT_FILTER).map((p) => p.name)).toEqual(['a', 'b', 'c']);
    expect(list).toEqual(copy);
  });

  it('sorts by name case-insensitively and by stars', () => {
    expect(applyFilter(list, { ...DEFAULT_FILTER, sort: 'name' }).map((p) => p.name)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(applyFilter(list, { ...DEFAULT_FILTER, sort: 'stars' })[0]?.name).toBe('b');
  });

  it('searches topics with AND semantics', () => {
    expect(applyFilter(list, { ...DEFAULT_FILTER, query: 'anime' }).map((p) => p.name)).toEqual([
      'b',
    ]);
    expect(applyFilter(list, { ...DEFAULT_FILTER, query: 'anime gamma' })).toHaveLength(0);
  });

  it('filters by language and category', () => {
    expect(applyFilter(list, { ...DEFAULT_FILTER, language: 'JavaScript' })).toHaveLength(2);
    expect(
      applyFilter(list, { ...DEFAULT_FILTER, category: 'Coursework' }).map((p) => p.name),
    ).toEqual(['a']);
  });
});

describe('languagesOf', () => {
  it('orders by frequency', () => {
    expect(languagesOf(list)).toEqual(['JavaScript', 'TypeScript']);
  });
});

describe('pickFeatured', () => {
  it('puts pinned first, then live demos, ignoring unknown pins', () => {
    expect(pickFeatured(list, ['b', 'nope'], 4).map((p) => p.name)).toEqual(['b', 'c']);
    expect(pickFeatured(list, ['a', 'b'], 1).map((p) => p.name)).toEqual(['a']);
  });
});

describe('URL query round-trip', () => {
  it('serializes non-defaults only', () => {
    expect(filterToQuery(DEFAULT_FILTER)).toBe('');
    const state = {
      query: 'react app',
      language: 'C#',
      category: 'Live' as const,
      sort: 'name' as const,
    };
    expect(filterFromQuery(filterToQuery(state))).toEqual(state);
  });

  it('falls back on invalid values', () => {
    expect(filterFromQuery('?sort=evil&cat=Nope')).toEqual(DEFAULT_FILTER);
  });
});
