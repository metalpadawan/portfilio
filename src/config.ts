import type { ShowcaseEntry } from './types.ts';

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

  /** About section (SPEC F14). Written in the owner's voice; plain text only. */
  about: {
    heading: 'A little about me',
    lead: 'I’m a Computer Programming student at BYU–Idaho and a Project Manager at Ten24Bit, based in Calabar, Nigeria. I enjoy taking a loose idea and shaping it into software that works, and I care just as much about how it feels to the person using it.',
    personal:
      'Away from the keyboard, you’ll usually find me deep in an anime series, playing games (mostly on mobile, which absolutely counts), out on the badminton court, or hunting down good food. I’m a fantasy reader and listener at heart, and The Silmarillion is my favourite: proof that the richest worlds are built patiently, one careful detail at a time.',
    aim: 'My dream is simple: to leave a legacy that strengthens anyone, regardless of race or background, and helps build a better future.',
  },

  /** "Off the clock" list in the About section. */
  interests: [
    { label: 'Anime', note: null },
    { label: 'Gaming', note: 'Mostly mobile, and it counts' },
    { label: 'Badminton', note: null },
    { label: 'Good food', note: null },
    { label: 'Fantasy', note: 'Books & audiobooks · The Silmarillion' },
  ] as readonly { label: string; note: string | null }[],

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

  /**
   * Public URL of the deployed site (trailing slash). Used for canonical/og:url and the absolute
   * og:image URL that link previews require. Update this if the repo is renamed.
   */
  siteUrl: 'https://metalpadawan.github.io/portfilio/',

  links: {
    github: 'https://github.com/metalpadawan',
    linkedin: 'https://www.linkedin.com/in/emmanuel-ndem-538125149/',
    email: 'Emmanuelndem9@gmail.com',
  },

  /** Repos never shown (e.g. the profile README repo). */
  exclude: ['metalpadawan'] as readonly string[],

  /** Repos pinned to the top of "Featured", in order. Remaining slots auto-fill with live demos, newest first. */
  featured: ['hearty-home-site', 'duborsub', 'uni-project', 'flight-site'] as readonly string[],
  featuredLimit: 4,

  /**
   * Projects with a private repository, listed with a live demo instead of source (SPEC F10).
   * A showcase entry replaces any public repo of the same name.
   */
  showcase: [
    {
      name: 'duborsub',
      title: 'Dub or Sub?',
      description:
        'Sub and dub ratings for every anime, side by side. Full-stack: Next.js, NestJS, PostgreSQL/Prisma, email accounts and admin moderation over a 38,000-title catalogue. Try the interactive demo.',
      demo: 'demos/duborsub/',
      language: 'TypeScript',
      topics: ['nextjs', 'nestjs', 'postgresql', 'prisma'],
      createdAt: '2026-03-19T00:00:00Z',
      updatedAt: '2026-11-09T05:15:03Z',
    },
  ] as readonly ShowcaseEntry[],

  /** Name prefixes that mark a repo as school coursework. */
  courseworkPrefixes: ['wdd', 'cse'] as readonly string[],

  /**
   * Per-repo title and description overrides (win over the GitHub description and README excerpt).
   * Written from each repo's actual contents (pages, packages, folder structure). See DEVLOG Step 8.
   * Tip: adding an "About" description on GitHub works too and needs no code change.
   */
  titles: {
    portfilio: 'This Portfolio',
    'uni-project': 'University Attendance Platform',
    module1: 'TypeScript Fluency (Module 1)',
    giovanni_site: 'GiovanniMarris Culinary Arts',
    'flight-site': 'AeroNexus Charter',
    'mission-prep-planner': 'Mission Prep Planner',
    'cse270-teton': 'Teton Chamber of Commerce (Testing)',
    'cse270-teton2': 'Teton Chamber of Commerce v2',
    cse212: 'Data Structures in C#',
    cse340: 'CSE Motors',
    cse340retake: 'CSE Motors: Accounts & Auth',
    cse341: 'Node & MongoDB Web Services',
    'crud-api': 'Books CRUD API',
    'backend-project-first': 'First Express Backend',
    wdd130: 'Shinigami Rafting Adventures',
    wdd131: 'Classic Anime Archive',
    wdd231: 'Calabar Chamber of Commerce',
    wdd330: 'SleepOutside Store',
    'team11-wdd330': 'SleepOutside Store (Team 11)',
    'wdd330-sleepoutside': 'SleepOutside Store (Team Fork)',
  } as Readonly<Record<string, string>>,

  descriptions: {
    portfilio:
      'The site you are looking at: every public repo pulled live from the GitHub API over a hand-written WebGL2 nebula and 16k-particle background. Vite + strict TypeScript, tested, CI-deployed.',
    'hearty-home-site':
      'React, Tailwind CSS and Framer Motion site for Hearty Home Services: cleaning, specialist hoarding support and home services, built to make booking simple.',
    'flight-site':
      'Marketing site for a commercial jet charter service: hero landing page, flight-request contact form and privacy page, deployed on Vercel with security headers.',
    'mission-prep-planner':
      'Multi-page planner for mission preparation: dashboard, goals with progress tracking, calendar and study resources, with data saved in the browser via localStorage.',
    'cse270-teton':
      'Software-testing course project: the Teton Idaho Chamber of Commerce site plus a Django directory-data service, covered by pytest tests with mocked HTTP requests.',
    'cse270-teton2':
      'Second iteration of the Teton Chamber of Commerce testing project (repository currently empty).',
    cse212:
      'Weekly C# data-structures work with unit tests: arrays, queues and priority queues, sets and maps, linked lists, recursion (maze solving) and binary search trees.',
    cse340:
      'CSE Motors vehicle-inventory web app: Node.js, Express and EJS views over PostgreSQL in an MVC structure, with inventory routes and error handling.',
    cse340retake:
      'CSE Motors rebuilt with user accounts: registration and login with bcrypt and JWT, sessions, flash messages, server-side validation and inventory management on PostgreSQL.',
    cse341:
      'Web-services coursework in Node.js: a contacts REST API and CoopConnect, a cooperative-directory API with JWT auth, Helmet, validation and Swagger docs, on MongoDB.',
    'crud-api':
      'REST API for books and users: Express and Mongoose on MongoDB, Google OAuth sign-in via Passport, JWT, Joi validation and Swagger documentation.',
    'backend-project-first':
      'My first Node.js backend: Express with EJS views, user sign-up and login with bcrypt and JWT cookies, and a SQLite database.',
    wdd130:
      'Intro web-design coursework, centred on a multi-page site for the fictional Shinigami Rafting Company: home, trips, about and contact pages.',
    wdd131:
      'Dynamic web fundamentals: a filtered temple photo album, forms and a final project, the Classic Anime Archive, with title guides and recommendations.',
    wdd231:
      'Web frontend coursework: a Calabar Chamber of Commerce site with member directory, discover page and join form, plus a final project, Indie Game Vault.',
    wdd330:
      'SleepOutside, an outdoor-gear e-commerce store built with Vite and vanilla JavaScript modules: product pages, cart and checkout.',
    'team11-wdd330':
      'Team 11 repository for the SleepOutside outdoor-gear store: product listings, product detail pages, cart and checkout, built collaboratively.',
    'wdd330-sleepoutside':
      'Fork of the team SleepOutside project used for the WDD 330 team activities: tent product pages, cart and checkout.',
  } as Readonly<Record<string, string>>,
} as const;

export type Config = typeof config;
