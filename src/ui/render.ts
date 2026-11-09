import type { ProfileStats } from '../projects/stats';
import { formatMonthYear } from '../projects/stats';
import type { Project } from '../types';
import { el, extLink, icon } from './dom';
import { languageColor } from './languages';

function languageBadge(language: string | null): HTMLElement | null {
  if (!language) return null;
  const dot = el('span', { class: 'lang__dot', 'aria-hidden': 'true' });
  dot.style.setProperty('--lang', languageColor(language));
  return el('span', { class: 'lang' }, [dot, language]);
}

function tags(project: Project): HTMLElement | null {
  const labels = [...project.categories, ...project.topics.slice(0, 4)];
  if (labels.length === 0) return null;
  return el(
    'ul',
    { class: 'tags', 'aria-label': 'Tags' },
    labels.map((label) => el('li', { class: `tag tag--${label.toLowerCase()}` }, [label])),
  );
}

function demoLink(project: Project, href: string): HTMLElement {
  const label = `Live demo of ${project.title}`;
  // Same-site demo pages open in place; external demos open in a new tab.
  return /^https?:/i.test(href)
    ? extLink(href, { class: 'btn btn--primary btn--sm', 'aria-label': label }, [
        'Live demo',
        icon('external', 14),
      ])
    : el('a', { href, class: 'btn btn--primary btn--sm', 'aria-label': label }, [
        'Live demo',
        icon('arrow', 14),
      ]);
}

function links(project: Project): HTMLElement {
  return el('div', { class: 'card__links' }, [
    project.demoUrl && demoLink(project, project.demoUrl),
    project.url
      ? extLink(
          project.url,
          { class: 'btn btn--ghost btn--sm', 'aria-label': `Source code of ${project.title}` },
          [icon('github', 14), 'Source'],
        )
      : el(
          'span',
          { class: 'private-badge', title: 'The source code of this project is private' },
          [icon('lock', 13), 'Private source'],
        ),
  ]);
}

export function projectCard(project: Project, variant: 'grid' | 'featured' = 'grid'): HTMLElement {
  const meta = el('div', { class: 'card__meta' }, [
    languageBadge(project.language),
    project.stars > 0 &&
      el('span', { class: 'card__stars' }, [icon('star', 13), String(project.stars)]),
    el('time', { class: 'card__date', datetime: project.updatedAt }, [
      `Updated ${formatMonthYear(project.updatedAt)}`,
    ]),
  ]);

  const titleId = `card-${variant}-${project.name}`;
  return el(
    'article',
    {
      class: `card card--${variant}`,
      'data-tilt': '',
      'data-key': titleId, // reveal memory (effects.ts)
      'aria-labelledby': titleId, // accessible name for screen-reader article navigation
    },
    [
      el('div', { class: 'card__glow', 'aria-hidden': 'true' }),
      meta,
      el('h3', { class: 'card__title', id: titleId }, [project.title]),
      el('p', { class: 'card__desc' }, [project.description]),
      tags(project),
      links(project),
    ],
  );
}

export function renderGrid(container: HTMLElement, projects: readonly Project[]): void {
  const fragment = document.createDocumentFragment();
  projects.forEach((p, i) => {
    const card = projectCard(p);
    card.style.setProperty('--i', String(Math.min(i, 12))); // stagger index for reveal
    fragment.appendChild(card);
  });
  container.replaceChildren(fragment);
}

export function renderFeatured(container: HTMLElement, projects: readonly Project[]): void {
  container.replaceChildren(...projects.map((p) => projectCard(p, 'featured')));
}

export function renderStats(container: HTMLElement, stats: ProfileStats): void {
  const items: [string, number][] = [
    ['Public projects', stats.projects],
    ['Live demos', stats.liveDemos],
    ['Languages', stats.languages],
    [stats.yearsActive === 1 ? 'Year on GitHub' : 'Years on GitHub', stats.yearsActive],
  ];
  container.replaceChildren(
    ...items.map(([label, value]) =>
      el('div', { class: 'stat' }, [
        el('dt', { class: 'stat__label' }, [label]),
        el('dd', { class: 'stat__value', 'data-count': value }, [String(value)]),
      ]),
    ),
  );
}

export function renderSkills(container: HTMLElement, skills: readonly string[]): void {
  container.replaceChildren(...skills.map((s) => el('li', { class: 'skill' }, [s])));
}
