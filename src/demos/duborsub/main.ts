/** Dub or Sub? interactive demo: entry point and hash router (ADR-0006). */
import './styles.css';
import sample from './data/sample.json';
import {
  parseRoute,
  sampleStats,
  topGenres,
  withVisitor,
  type Route,
  type Title,
  type TitleStats,
  type VisitorState,
} from './model';
import { loadVisitor, resetVisitor, saveVisitor } from './store';
import { collectionView, requestView, workView, type Ctx } from './views';

const titles = (sample as { items: Title[] }).items;
const byId = new Map(titles.map((t) => [t.id, t]));
const baseStats = new Map<number, TitleStats>(titles.map((t) => [t.id, sampleStats(t)]));
let visitor: VisitorState = loadVisitor();
let flash: string | null = null;

function mainElement(): HTMLElement {
  const node = document.getElementById('main');
  if (!(node instanceof HTMLElement))
    throw new Error('#main missing from demos/duborsub/index.html');
  return node;
}
const main = mainElement();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function update(next: VisitorState, message: string): void {
  visitor = next;
  saveVisitor(visitor);
  flash = message;
  render({ keepScroll: true });
}

const ctx: Ctx = {
  titles,
  genres: topGenres(titles, 8),
  byId,
  stats: (id) => {
    const base = baseStats.get(id) ?? sampleStats({ id, rank: 999 });
    return withVisitor(base, id, visitor);
  },
  visitor: () => visitor,
  rate: (id, version, score) => {
    const key = String(id);
    const ratings = { ...visitor.ratings, [key]: { ...visitor.ratings[key], [version]: score } };
    update({ ...visitor, ratings }, `Saved. ${version} rated ${String(score)} of 5.`);
  },
  clearRatings: (id) => {
    const ratings = Object.fromEntries(
      Object.entries(visitor.ratings).filter(([key]) => key !== String(id)),
    );
    update({ ...visitor, ratings }, 'Your ratings for this work were cleared.');
  },
  report: (id) => {
    if (visitor.reports.includes(id)) return;
    const next = { ...visitor, reports: [...visitor.reports, id] };
    const onRecord = withVisitor(
      baseStats.get(id) ?? sampleStats({ id, rank: 999 }),
      id,
      next,
    ).dubOnRecord;
    update(
      next,
      onRecord ? 'Thanks. The dub is now on record.' : 'Thanks. Your report is counted.',
    );
  },
  request: (title, note) => {
    const requests = [{ title, note, at: new Date().toISOString() }, ...visitor.requests].slice(
      0,
      50,
    );
    update(
      { ...visitor, requests },
      `Thanks. “${title}” is in the request queue (in the full app, an admin reviews it).`,
    );
  },
};

function view(route: Route): HTMLElement {
  switch (route.view) {
    case 'work':
      return workView(ctx, route.id, flash);
    case 'request':
      return requestView(ctx, flash);
    default:
      return collectionView(ctx, route);
  }
}

let lastView = '';
function render(opts: { keepScroll?: boolean } = {}): void {
  const route = parseRoute(location.hash);
  const viewKey = route.view === 'work' ? `work/${String(route.id)}` : route.view;
  const firstRender = lastView === '';
  const changedPage = viewKey !== lastView;
  const active = document.activeElement;
  // Unique key of the control the visitor used (e.g. "tile-dub-5"), to restore focus after re-render.
  const focusKey = active instanceof HTMLElement ? (active.dataset['focusKey'] ?? null) : null;

  const afterSwap = (): void => {
    if (firstRender) return; // initial load: leave focus and scroll to the browser
    if (opts.keepScroll) {
      if (focusKey) {
        // If the control is gone (e.g. the report button once a dub is on record), land on its section.
        const target =
          main.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusKey)}"]`) ??
          document.getElementById('rate-title');
        target?.focus();
      }
    } else if (changedPage) {
      window.scrollTo({ top: 0 });
      main.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    } else {
      // Same page, new sort/genre/page: bring the collection into view.
      document.getElementById('collection-title')?.scrollIntoView({ block: 'start' });
    }
  };

  const swap = (): void => {
    main.replaceChildren(view(route));
    flash = null;
    document.title =
      route.view === 'work'
        ? `${main.querySelector('h1')?.textContent ?? 'Work'} · Dub or Sub? demo`
        : route.view === 'request'
          ? 'Request a title · Dub or Sub? demo'
          : 'Dub or Sub? · Interactive demo';
    // Runs inside the swap: a view transition swaps asynchronously, so focusing afterwards
    // would target the outgoing page (found in browser QA, DEVLOG Step 10).
    afterSwap();
  };

  // One authored transition between pages, never on in-page updates (DESIGN.md motion rules).
  // View Transitions are progressive: older browsers just swap.
  const canTransition = 'startViewTransition' in document;
  if (changedPage && !firstRender && canTransition && !reducedMotion.matches) {
    document.startViewTransition(swap);
  } else swap();
  lastView = viewKey;
}

window.addEventListener('hashchange', () => {
  render();
});

// "/" focuses search (keyboard-first, as in the real app).
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target as HTMLElement | null;
  if (target && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName)))
    return;
  const search = document.getElementById('q');
  if (search) {
    e.preventDefault();
    search.focus();
  } else {
    location.hash = '#/';
    requestAnimationFrame(() => document.getElementById('q')?.focus());
  }
});

document.getElementById('reset-demo')?.addEventListener('click', () => {
  visitor = resetVisitor();
  flash = 'Your demo data was cleared.';
  render({ keepScroll: true });
});

const count = document.getElementById('title-count');
if (count) count.textContent = String(titles.length);

render();
