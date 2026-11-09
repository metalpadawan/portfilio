import { describe, expect, it } from 'vitest';
import { mergeRepos } from '../src/github/api';
import { computeStats, formatMonthYear } from '../src/projects/stats';
import { project, repo } from './fixtures';

describe('computeStats', () => {
  it('counts projects, demos, languages and whole years', () => {
    const stats = computeStats(
      [
        project({ demoUrl: 'https://x' }),
        project({ language: 'Python' }),
        project({ language: null }),
      ],
      '2023-08-22T09:14:36Z',
      new Date('2026-11-09T00:00:00Z'),
    );
    expect(stats).toEqual({ projects: 3, liveDemos: 1, languages: 2, yearsActive: 3 });
  });
});

describe('formatMonthYear', () => {
  it('formats in UTC and tolerates bad input', () => {
    expect(formatMonthYear('2026-08-17T23:59:00Z')).toBe('Aug 2026');
    expect(formatMonthYear('nope')).toBe('');
  });
});

describe('mergeRepos', () => {
  it('keeps snapshot excerpts and includes new live repos', () => {
    const merged = mergeRepos(
      [
        {
          ...repo({ name: 'old', stargazers_count: 1 }),
          readme_excerpt: 'excerpt',
          demo_status: 'broken',
        },
      ],
      [repo({ name: 'old', stargazers_count: 5 }), repo({ name: 'brand-new' })],
    );
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({
      name: 'old',
      stargazers_count: 5,
      readme_excerpt: 'excerpt',
      demo_status: 'broken',
    });
    expect(merged[1]).toMatchObject({ name: 'brand-new', readme_excerpt: null, demo_status: null });
  });

  it('forgets a broken-demo verdict when the demo URL changed since the snapshot', () => {
    const merged = mergeRepos(
      [
        {
          ...repo({ name: 'x', homepage: 'https://old.app' }),
          readme_excerpt: null,
          demo_status: 'broken',
        },
      ],
      [repo({ name: 'x', homepage: 'https://new.app' })],
    );
    expect(merged[0]?.demo_status).toBeNull();
  });
});
