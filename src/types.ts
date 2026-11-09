/** Subset of the GitHub REST `repository` object that this site uses. */
export interface GitHubRepo {
  name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  has_pages: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

/** Result of probing a repo's live-demo URL at snapshot time. null = no demo or not checked. */
export type DemoStatus = 'ok' | 'broken' | null;

/** Repo entry stored in the build-time snapshot (adds a README excerpt and demo health). */
export interface SnapshotRepo extends GitHubRepo {
  readme_excerpt: string | null;
  demo_status: DemoStatus;
}

export interface Snapshot {
  generatedAt: string;
  user: {
    login: string;
    name: string | null;
    avatar_url: string;
    html_url: string;
    created_at: string;
  };
  repos: SnapshotRepo[];
}

export type Category = 'Live' | 'Coursework' | 'Fork' | 'Personal';

/** Normalized domain model rendered by the UI. */
export interface Project {
  name: string;
  title: string;
  description: string;
  url: string;
  demoUrl: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  fork: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
}

export type SortKey = 'updated' | 'created' | 'name' | 'stars';

export interface FilterState {
  query: string;
  language: string | null;
  category: Category | null;
  sort: SortKey;
}
