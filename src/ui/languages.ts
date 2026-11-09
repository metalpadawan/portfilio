/** GitHub linguist colors for languages likely to appear; unknown → neutral. */
const COLORS: Readonly<Record<string, string>> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#663399',
  Python: '#3572A5',
  'C#': '#178600',
  Java: '#b07219',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Go: '#00ADD8',
  Rust: '#dea584',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

export function languageColor(language: string | null): string {
  return (language && COLORS[language]) ?? '#8b93a7';
}
