/**
 * Owner-editable configuration (SPEC F8).
 * Change text here; no UI code needs to change.
 * Profile text is sourced from the public profile README (github.com/metalpadawan/metalpadawan).
 */
export const config = {
  username: 'metalpadawan',
  displayName: 'Emmanuel Asukwo Ndem',
  role: 'Developer & Project Manager',
  location: 'Calabar, Nigeria',
  tagline: 'I turn software requirements into clean, working web applications.',
  intro:
    'Computer Programming student at BYU–Idaho and Project Manager at Ten24Bit. Below is every public project on my GitHub, pulled live from the API: deployed sites, full-stack apps and coursework.',

  skills: [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C#',
    'HTML/CSS',
    'React',
    'Node.js',
    'PostgreSQL',
    'Responsive design',
  ] as readonly string[],

  links: {
    github: 'https://github.com/metalpadawan',
    linkedin: 'https://www.linkedin.com/in/emmanuel-ndem-538125149/',
    email: 'Emmanuelndem9@gmail.com',
  },

  /** Repos never shown (e.g. the profile README repo). */
  exclude: ['metalpadawan'] as readonly string[],

  /** Repos pinned to the top of "Featured", in order. Remaining slots auto-fill with live demos, newest first. */
  featured: ['duborsub', 'uni-project', 'hearty-home-site'] as readonly string[],
  featuredLimit: 4,

  /** Name prefixes that mark a repo as school coursework. */
  courseworkPrefixes: ['wdd', 'cse'] as readonly string[],

  /** Optional per-repo description overrides (win over GitHub description and README excerpt). */
  titles: {
    duborsub: 'Dub or Sub?',
    'uni-project': 'University Attendance Platform',
    module1: 'TypeScript Fluency (Module 1)',
    giovanni_site: 'GiovanniMarris Culinary Arts',
  } as Readonly<Record<string, string>>,

  descriptions: {
    duborsub:
      'Sub and dub ratings for every anime, side by side, so you can decide how to watch before you start.',
    'hearty-home-site':
      'React, Tailwind CSS and Framer Motion site for Hearty Home Services: cleaning, specialist hoarding support and home services, built to make booking simple.',
  } as Readonly<Record<string, string>>,
} as const;

export type Config = typeof config;
