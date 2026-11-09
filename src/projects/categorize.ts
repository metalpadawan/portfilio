import type { Category } from '../types';

interface CategorizeInput {
  name: string;
  fork: boolean;
  demoUrl: string | null;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * True when any name segment is a course code: a prefix immediately followed by a digit.
 * "wdd130", "cse340retake" and "team11-wdd330" match; "csesomething" does not.
 */
export function isCourseworkName(name: string, prefixes: readonly string[]): boolean {
  const segments = name.toLowerCase().split(/[-_.\s]+/);
  return prefixes.some((prefix) => {
    const code = new RegExp(`^${escapeRegExp(prefix.toLowerCase())}\\d`);
    return segments.some((segment) => code.test(segment));
  });
}

/** Rule-based categories (SPEC F5). Pure. Order is stable for display. */
export function categorize(
  repo: CategorizeInput,
  courseworkPrefixes: readonly string[],
): Category[] {
  const categories: Category[] = [];

  if (repo.demoUrl) categories.push('Live');
  const isCoursework = isCourseworkName(repo.name, courseworkPrefixes);
  categories.push(isCoursework ? 'Coursework' : 'Personal');
  if (repo.fork) categories.push('Fork');

  return categories;
}
