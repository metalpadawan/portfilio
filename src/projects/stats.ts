import type { Project } from '../types';

export interface ProfileStats {
  projects: number;
  liveDemos: number;
  languages: number;
  yearsActive: number;
}

/** Pure hero stats (SPEC F6). `now` is injectable for deterministic tests. */
export function computeStats(
  projects: readonly Project[],
  accountCreated: string,
  now = new Date(),
): ProfileStats {
  const created = new Date(accountCreated);
  const years = (now.getTime() - created.getTime()) / (365.25 * 24 * 3600 * 1000);
  return {
    projects: projects.length,
    liveDemos: projects.filter((p) => p.demoUrl).length,
    languages: new Set(projects.map((p) => p.language).filter(Boolean)).size,
    yearsActive: Math.max(1, Math.floor(years)),
  };
}

/** "2026-08-17T…" → "Aug 2026" (stable across locales for consistent layout). */
export function formatMonthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}
