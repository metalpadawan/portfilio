/**
 * URL helpers. Dependency-free so the Node snapshot script can import them directly (ADR-0005).
 */

/** Accept only http(s) URLs; anything else (javascript:, empty, garbage) becomes null. */
export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Live demo: explicit homepage first, else the GitHub Pages URL when Pages is enabled. */
export function demoUrlFor(
  repo: { homepage: string | null; has_pages: boolean; name: string },
  username: string,
): string | null {
  const homepage = safeUrl(repo.homepage);
  if (homepage) return homepage;
  if (repo.has_pages) return `https://${username.toLowerCase()}.github.io/${repo.name}/`;
  return null;
}

/**
 * Classify a demo-URL probe. Only definitive "gone" answers (404/410) mark a demo broken;
 * timeouts, 5xx and bot-blocking (403/429) are inconclusive, so the link stays visible.
 */
export function classifyDemoStatus(httpStatus: number | null): 'ok' | 'broken' | null {
  if (httpStatus === null) return null;
  if (httpStatus === 404 || httpStatus === 410) return 'broken';
  if (httpStatus >= 200 && httpStatus < 400) return 'ok';
  return null;
}

/** Sized avatar URL that works whether or not the source URL already has a query string. */
export function sizedAvatar(avatarUrl: string, size: number): string {
  try {
    const url = new URL(avatarUrl);
    url.searchParams.set('s', String(size));
    return url.href;
  } catch {
    return avatarUrl;
  }
}
