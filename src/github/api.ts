import type { GitHubRepo, SnapshotRepo } from '../types';

const CACHE_KEY = 'gh-repos-v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

export type LiveResult =
  | { ok: true; repos: GitHubRepo[]; fromCache: boolean }
  | { ok: false; reason: 'rate-limited' | 'network' | 'http'; status?: number };

interface CacheEntry {
  at: number;
  repos: GitHubRepo[];
}

function readCache(): GitHubRepo[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    return Date.now() - entry.at < CACHE_TTL_MS && Array.isArray(entry.repos) ? entry.repos : null;
  } catch {
    return null; // storage blocked / corrupt — just refetch
  }
}

function writeCache(repos: GitHubRepo[]): void {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), repos } satisfies CacheEntry),
    );
  } catch {
    /* quota or privacy mode — caching is optional */
  }
}

/** Fetch the live repo list once per session window (ADR-0003). Never throws. */
export async function fetchLiveRepos(username: string, signal?: AbortSignal): Promise<LiveResult> {
  const cached = readCache();
  if (cached) return { ok: true, repos: cached, fromCache: true };

  try {
    // Paginate so every repo is shown even past 100 (SPEC F1). One request for most users.
    const repos: GitHubRepo[] = [];
    for (let page = 1; page <= 10; page++) {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&sort=pushed&page=${String(page)}`,
        { headers: { Accept: 'application/vnd.github+json' }, ...(signal ? { signal } : {}) },
      );
      if (res.status === 403 || res.status === 429)
        return { ok: false, reason: 'rate-limited', status: res.status };
      if (!res.ok) return { ok: false, reason: 'http', status: res.status };
      const batch = (await res.json()) as GitHubRepo[];
      repos.push(...batch);
      if (batch.length < 100) break;
    }
    writeCache(repos);
    return { ok: true, repos, fromCache: false };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/**
 * Pure merge: live data wins for fresh fields; README excerpts and demo health come from the
 * snapshot. Repos that exist live but not in the snapshot are included (unchecked).
 * A demo is only trusted as "broken" while its URL is unchanged since the snapshot probed it.
 */
export function mergeRepos(
  snapshot: readonly SnapshotRepo[],
  live: readonly GitHubRepo[],
): SnapshotRepo[] {
  const known = new Map(snapshot.map((r) => [r.name, r]));
  return live.map((r) => {
    const snap = known.get(r.name);
    const sameDemo = snap?.homepage === r.homepage && snap.has_pages === r.has_pages;
    return {
      ...r,
      readme_excerpt: snap?.readme_excerpt ?? null,
      demo_status: sameDemo ? snap.demo_status : null,
    };
  });
}
