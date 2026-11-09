import { describe, expect, it } from 'vitest';
import { demoUrlFor, normalizeRepo, prettifyName, safeUrl } from '../src/github/normalize';
import { classifyDemoStatus, sizedAvatar } from '../src/github/urls';
import { categorize, isCourseworkName } from '../src/projects/categorize';
import { repo } from './fixtures';

const opts = { username: 'metalpadawan', courseworkPrefixes: ['wdd', 'cse'], descriptions: {} };

describe('safeUrl', () => {
  it('accepts http(s) and adds a missing scheme', () => {
    expect(safeUrl('https://a.vercel.app')).toBe('https://a.vercel.app/');
    expect(safeUrl('a.vercel.app')).toBe('https://a.vercel.app/');
  });
  it('rejects empty and non-http values', () => {
    expect(safeUrl('')).toBeNull();
    expect(safeUrl(null)).toBeNull();
    expect(safeUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('demoUrlFor', () => {
  it('prefers the homepage', () => {
    expect(demoUrlFor({ name: 'x', homepage: 'https://x.dev', has_pages: true }, 'u')).toBe(
      'https://x.dev/',
    );
  });
  it('falls back to GitHub Pages', () => {
    expect(demoUrlFor({ name: 'wdd131', homepage: null, has_pages: true }, 'MetalPadawan')).toBe(
      'https://metalpadawan.github.io/wdd131/',
    );
  });
  it('returns null with neither', () => {
    expect(demoUrlFor({ name: 'x', homepage: '', has_pages: false }, 'u')).toBeNull();
  });
});

describe('prettifyName', () => {
  it.each([
    ['hearty-home-site', 'Hearty Home Site'],
    ['cse270-teton2', 'CSE270 Teton2'],
    ['crud-api', 'CRUD API'],
    ['giovanni_site', 'Giovanni Site'],
  ])('%s → %s', (input, expected) => {
    expect(prettifyName(input)).toBe(expected);
  });
});

describe('normalizeRepo', () => {
  it('uses description precedence: override > GitHub > README > fallback', () => {
    const r = repo({ name: 'a', description: 'gh desc' });
    expect(
      normalizeRepo(r, 'readme', { ...opts, descriptions: { a: 'override' } }).description,
    ).toBe('override');
    expect(normalizeRepo(r, 'readme', opts).description).toBe('gh desc');
    expect(normalizeRepo(repo({ description: '  ' }), 'readme', opts).description).toBe('readme');
    expect(normalizeRepo(repo(), null, opts).description).toMatch(/No description yet/);
  });

  it('uses a title override when configured, else a prettified name', () => {
    const titles = { duborsub: 'Dub or Sub?' };
    expect(normalizeRepo(repo({ name: 'duborsub' }), null, { ...opts, titles }).title).toBe(
      'Dub or Sub?',
    );
    expect(normalizeRepo(repo({ name: 'crud-api' }), null, { ...opts, titles }).title).toBe(
      'CRUD API',
    );
  });

  it('uses pushed_at as the updated date', () => {
    const p = normalizeRepo(repo({ pushed_at: '2026-01-01T00:00:00Z' }), null, opts);
    expect(p.updatedAt).toBe('2026-01-01T00:00:00Z');
  });
});

describe('categorize', () => {
  it('tags coursework, live and forks', () => {
    expect(categorize({ name: 'WDD330-x', fork: true, demoUrl: 'https://x' }, ['wdd'])).toEqual([
      'Live',
      'Coursework',
      'Fork',
    ]);
    expect(categorize({ name: 'duborsub', fork: false, demoUrl: null }, ['wdd'])).toEqual([
      'Personal',
    ]);
  });

  it('finds course codes in any name segment (regression: team11-wdd330 was "Personal")', () => {
    const prefixes = ['wdd', 'cse'];
    expect(isCourseworkName('team11-wdd330', prefixes)).toBe(true);
    expect(isCourseworkName('cse340retake', prefixes)).toBe(true);
    expect(isCourseworkName('wdd130', prefixes)).toBe(true);
    expect(isCourseworkName('csesomething', prefixes)).toBe(false);
    expect(isCourseworkName('mission-prep-planner', prefixes)).toBe(false);
  });
});

describe('demo health', () => {
  it('only treats 404/410 as broken; inconclusive answers keep the link', () => {
    expect(classifyDemoStatus(200)).toBe('ok');
    expect(classifyDemoStatus(301)).toBe('ok');
    expect(classifyDemoStatus(404)).toBe('broken');
    expect(classifyDemoStatus(410)).toBe('broken');
    expect(classifyDemoStatus(403)).toBeNull();
    expect(classifyDemoStatus(503)).toBeNull();
    expect(classifyDemoStatus(null)).toBeNull();
  });

  it('hides a broken demo and drops the Live category', () => {
    const r = repo({ homepage: 'https://gone.vercel.app' });
    const p = normalizeRepo(r, null, opts, 'broken');
    expect(p.demoUrl).toBeNull();
    expect(p.categories).not.toContain('Live');
    expect(normalizeRepo(r, null, opts, 'ok').demoUrl).toBe('https://gone.vercel.app/');
    expect(normalizeRepo(r, null, opts).demoUrl).toBe('https://gone.vercel.app/');
  });
});

describe('sizedAvatar', () => {
  it('sets the size whether or not a query string exists', () => {
    expect(sizedAvatar('https://avatars.githubusercontent.com/u/1?v=4', 320)).toBe(
      'https://avatars.githubusercontent.com/u/1?v=4&s=320',
    );
    expect(sizedAvatar('https://example.com/me.png', 320)).toBe('https://example.com/me.png?s=320');
  });
});
