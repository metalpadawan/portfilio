import { categorize } from '../projects/categorize';
import type { DemoStatus, GitHubRepo, Project, ShowcaseEntry } from '../types';
import { demoUrlFor, safeUrl } from './urls';

export { demoUrlFor, safeUrl } from './urls';

export interface NormalizeOptions {
  username: string;
  courseworkPrefixes: readonly string[];
  descriptions: Readonly<Record<string, string>>;
  titles?: Readonly<Record<string, string>>;
}

const FALLBACK_DESCRIPTION = 'No description yet. Open the repository to explore the code.';

/** "hearty-home-site" → "Hearty Home Site", "cse270-teton2" → "CSE270 Teton2". */
export function prettifyName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => {
      if (/^[a-z]{2,4}\d+$/i.test(word)) return word.toUpperCase(); // course codes
      if (/^(api|crud|ui|ux|sql|css|html|js|ts)$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Pure mapping from GitHub API shape (+ optional README excerpt) to the domain model. */
export function normalizeRepo(
  repo: GitHubRepo,
  readmeExcerpt: string | null,
  opts: NormalizeOptions,
  demoStatus: DemoStatus = null,
): Project {
  // A demo the snapshot found dead (404/410) is hidden rather than shown as a broken link.
  const demoUrl = demoStatus === 'broken' ? null : demoUrlFor(repo, opts.username);
  const description =
    opts.descriptions[repo.name]?.trim() ||
    repo.description?.trim() ||
    readmeExcerpt?.trim() ||
    FALLBACK_DESCRIPTION;

  return {
    name: repo.name,
    title: opts.titles?.[repo.name]?.trim() || prettifyName(repo.name),
    description,
    url: repo.html_url,
    demoUrl,
    privateSource: false,
    language: repo.language,
    topics: repo.topics ?? [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    fork: repo.fork,
    archived: repo.archived,
    createdAt: repo.created_at,
    updatedAt: repo.pushed_at || repo.updated_at,
    categories: categorize({ name: repo.name, fork: repo.fork, demoUrl }, opts.courseworkPrefixes),
  };
}

/**
 * A showcase project (private repository): demo link, no source link (SPEC F10).
 * Relative demo paths are same-site pages and are kept as-is; absolute ones are sanitized.
 */
export function showcaseToProject(entry: ShowcaseEntry): Project {
  const demoUrl = /^[a-z0-9][a-z0-9/_-]*\/?$/i.test(entry.demo) ? entry.demo : safeUrl(entry.demo);
  return {
    name: entry.name,
    title: entry.title,
    description: entry.description,
    url: null,
    demoUrl,
    privateSource: true,
    language: entry.language,
    topics: [...entry.topics],
    stars: 0,
    forks: 0,
    fork: false,
    archived: false,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    categories: demoUrl ? ['Live', 'Personal'] : ['Personal'],
  };
}

/** Repos plus showcase entries; a showcase entry replaces a repo of the same name. */
export function withShowcase(
  repos: readonly Project[],
  showcase: readonly ShowcaseEntry[],
): Project[] {
  const names = new Set(showcase.map((s) => s.name));
  return [...repos.filter((p) => !names.has(p.name)), ...showcase.map(showcaseToProject)];
}
