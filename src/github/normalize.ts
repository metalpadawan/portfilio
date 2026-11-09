import { categorize } from '../projects/categorize';
import type { DemoStatus, GitHubRepo, Project } from '../types';
import { demoUrlFor } from './urls';

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
