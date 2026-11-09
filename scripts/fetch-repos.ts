/**
 * Build-time snapshot generator (ADR-0003, SPEC F3).
 * Usage: `npm run snapshot` (optionally with GITHUB_TOKEN set for a higher rate limit).
 * Runs on Node >= 22.18 via native TypeScript type stripping. No dependencies.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readmeExcerpt } from '../src/github/readme.ts';
import { classifyDemoStatus, demoUrlFor } from '../src/github/urls.ts';
import type { DemoStatus, GitHubRepo, Snapshot, SnapshotRepo } from '../src/types.ts';

const USERNAME = process.env['GH_USER'] ?? 'metalpadawan';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/repos.json');
const API = 'https://api.github.com';

const headers: Record<string, string> = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'portfolio-snapshot-script',
  'X-GitHub-Api-Version': '2022-11-28',
};
const token = process.env['GITHUB_TOKEN'];
if (token) headers['Authorization'] = `Bearer ${token}`;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function getReadme(repo: string): Promise<string | null> {
  const res = await fetch(`${API}/repos/${USERNAME}/${repo}/readme`, {
    headers: { ...headers, Accept: 'application/vnd.github.raw' },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`README ${repo} → ${res.status}`);
  return res.text();
}

/** All pages of the repo list ("display ALL my projects" must hold past 100 repos). */
async function getAllRepos(): Promise<GitHubRepo[]> {
  const all: GitHubRepo[] = [];
  for (let page = 1; ; page++) {
    const batch = await getJson<GitHubRepo[]>(
      `/users/${USERNAME}/repos?per_page=100&type=owner&page=${String(page)}`,
    );
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

/** Probe a demo URL (GET, follows redirects, 12 s timeout). Network errors are inconclusive. */
async function probeDemo(url: string | null): Promise<DemoStatus> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12_000),
      headers: { 'User-Agent': 'portfolio-snapshot-script (link check)' },
    });
    await res.body?.cancel();
    return classifyDemoStatus(res.status);
  } catch {
    return classifyDemoStatus(null);
  }
}

async function main(): Promise<void> {
  const user = await getJson<Snapshot['user']>(`/users/${USERNAME}`);
  const repos = await getAllRepos();

  // Any non-404 README failure (e.g. rate limit) aborts the run: a partial snapshot
  // would silently wipe good excerpts (found in DEVLOG Step 3).
  const withReadmes: SnapshotRepo[] = await Promise.all(
    repos.map(async (repo) => {
      const [md, demoStatus] = await Promise.all([
        getReadme(repo.name),
        probeDemo(demoUrlFor(repo, USERNAME)),
      ]);
      return {
        ...pick(repo),
        readme_excerpt: md ? readmeExcerpt(md) : null,
        demo_status: demoStatus,
      };
    }),
  );

  const snapshot: Snapshot = {
    generatedAt: new Date().toISOString(),
    user: {
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      created_at: user.created_at,
    },
    repos: withReadmes.sort((a, b) => b.pushed_at.localeCompare(a.pushed_at)),
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  const excerpts = withReadmes.filter((r) => r.readme_excerpt).length;
  const broken = withReadmes.filter((r) => r.demo_status === 'broken').map((r) => r.name);
  console.log(
    `✔ ${String(withReadmes.length)} repos (${String(excerpts)} README excerpts) → ${OUT}`,
  );
  if (broken.length > 0) console.warn(`  ⚠ Dead demo links hidden: ${broken.join(', ')}`);
}

/** Keep only the fields the site uses, so the bundle stays small. */
function pick(r: GitHubRepo): GitHubRepo {
  return {
    name: r.name,
    html_url: r.html_url,
    description: r.description,
    homepage: r.homepage,
    language: r.language,
    topics: r.topics ?? [],
    stargazers_count: r.stargazers_count,
    forks_count: r.forks_count,
    fork: r.fork,
    archived: r.archived,
    has_pages: r.has_pages,
    created_at: r.created_at,
    updated_at: r.updated_at,
    pushed_at: r.pushed_at,
  };
}

main().catch((err: unknown) => {
  console.error(`✖ Snapshot not written: ${String(err)}`);
  if (String(err).includes('403'))
    console.error('  Rate limited. Wait for reset or set GITHUB_TOKEN.');
  process.exitCode = 1;
});
