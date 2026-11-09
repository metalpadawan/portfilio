import type { GitHubRepo, Project } from '../src/types';

export function repo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    name: 'sample-repo',
    html_url: 'https://github.com/metalpadawan/sample-repo',
    description: null,
    homepage: null,
    language: 'JavaScript',
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    fork: false,
    archived: false,
    has_pages: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-02-01T00:00:00Z',
    pushed_at: '2025-02-01T00:00:00Z',
    ...overrides,
  };
}

export function project(overrides: Partial<Project> = {}): Project {
  return {
    name: 'sample',
    title: 'Sample',
    description: 'A sample project',
    url: 'https://github.com/metalpadawan/sample',
    demoUrl: null,
    language: 'JavaScript',
    topics: [],
    stars: 0,
    forks: 0,
    fork: false,
    archived: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
    categories: ['Personal'],
    privateSource: false,
    ...overrides,
  };
}
