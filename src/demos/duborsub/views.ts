/** Dub or Sub? demo pages: collection, work, request (SPEC F11). */
import { el } from '../../ui/dom';
import {
  DUB_THRESHOLD,
  SORTS,
  collectionHash,
  describeSplit,
  displayTitle,
  formatLabel,
  matches,
  paginate,
  plural,
  sortRows,
  verdictSentence,
  type Route,
  type Row,
  type Score,
  type Title,
  type TitleStats,
  type Version,
  type VisitorState,
} from './model';
import { distribution, measure, metaLine, notice, plate, ratingTiles, sampleTag } from './ui';

export interface Ctx {
  titles: readonly Title[];
  genres: readonly string[];
  byId: ReadonlyMap<number, Title>;
  stats: (id: number) => TitleStats;
  visitor: () => VisitorState;
  rate: (id: number, version: Version, score: Score) => void;
  clearRatings: (id: number) => void;
  report: (id: number) => void;
  request: (title: string, note: string) => void;
}

type CollectionRoute = Extract<Route, { view: 'collection' }>;

const rowOf = (ctx: Ctx, t: Title): Row => {
  const stats = ctx.stats(t.id);
  return { title: t, stats, split: describeSplit(stats.sub.average, stats.dub.average) };
};

function verdictTag(tag: string, lead: boolean): HTMLElement {
  const quiet = tag === 'Sub only' || tag === 'Dub only' || tag === 'Unrated';
  return el(
    'span',
    { class: `verdict${lead ? ' verdict--lead' : ''}${quiet ? ' verdict--quiet' : ''}` },
    [tag],
  );
}

// ---------- Collection ----------

function searchForm(route: CollectionRoute): HTMLElement {
  const input = el('input', {
    id: 'q',
    name: 'q',
    type: 'search',
    value: route.q,
    placeholder: 'Title in English, Japanese or romaji',
    autocomplete: 'off',
  });
  const form = el('form', { class: 'search', role: 'search' }, [
    el('label', { class: 'signage', for: 'q' }, ['Search the collection']),
    el('span', { class: 'search__field' }, [
      input,
      el('kbd', { class: 'search__kbd', 'aria-hidden': 'true' }, ['/']),
      el('button', { type: 'submit', class: 'btn btn--ink btn--sm' }, ['Search']),
    ]),
  ]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    location.hash = collectionHash({ ...route, q: input.value.trim(), page: 1 });
  });
  return form;
}

function featured(ctx: Ctx): HTMLElement | null {
  // The most-voted title whose dub is on record: a work worth comparing.
  const pick = sortRows(
    ctx.titles.slice(0, 40).map((t) => rowOf(ctx, t)),
    'votes',
  ).find((r) => r.stats.dubOnRecord && r.split.lead);
  if (!pick) return null;
  const { title: t, stats, split } = pick;
  return el('figure', { class: 'hang' }, [
    el(
      'a',
      {
        class: 'hang__work',
        href: `#/work/${String(t.id)}`,
        tabindex: '-1',
        'aria-hidden': 'true',
      },
      [plate(t, 'hung')],
    ),
    el('figcaption', { class: 'label' }, [
      el('a', { class: 'label__title drawn', href: `#/work/${String(t.id)}` }, [displayTitle(t)]),
      metaLine(t),
      el('span', { class: 'caption' }, [t.native ?? t.title]),
      el('div', { class: 'label__measures' }, [
        measure('sub', stats.sub, { lead: split.lead === 'sub', emptyLabel: 'No ratings' }),
        measure('dub', stats.dub, { lead: split.lead === 'dub', emptyLabel: 'Not listed' }),
      ]),
      el('p', { class: 'label__verdict' }, [
        verdictSentence(split, stats.dubOnRecord),
        ' ',
        sampleTag(),
      ]),
    ]),
  ]);
}

function tabs(
  label: string,
  items: readonly { text: string; href: string; current: boolean }[],
): HTMLElement {
  return el('nav', { class: 'tabs', 'aria-label': label }, [
    el('span', { class: 'signage tabs__label', 'aria-hidden': 'true' }, [label]),
    el(
      'ul',
      { class: 'tabs__list' },
      items.map((i) =>
        el('li', {}, [
          el('a', { class: 'tab', href: i.href, 'aria-current': i.current ? 'page' : null }, [
            i.text,
          ]),
        ]),
      ),
    ),
  ]);
}

function checklistRow(row: Row): HTMLElement {
  const { title: t, stats, split } = row;
  const href = `#/work/${String(t.id)}`;
  const measures =
    split.tag === 'Unrated'
      ? [el('span', { class: 'row__none caption' }, ['No ratings yet'])]
      : [
          measure('sub', stats.sub, {
            lead: split.lead === 'sub',
            emptyLabel: 'No ratings',
            showName: false,
          }),
          measure('dub', stats.dub, {
            lead: split.lead === 'dub',
            emptyLabel: stats.dubOnRecord ? 'No ratings' : 'Not listed',
            showName: false,
          }),
        ];
  return el('li', { class: 'row' }, [
    el('a', { class: 'row__link', href }, [
      plate(t, 'thumb'),
      el('span', { class: 'row__title' }, [
        el('span', { class: 'row__name' }, [displayTitle(t)]),
        el('span', { class: 'row__meta' }, [metaLine(t), sampleTag()]),
      ]),
      el('span', { class: 'row__measures' }, measures),
      verdictTag(split.tag, split.lead === 'sub' || split.lead === 'dub'),
    ]),
  ]);
}

export function collectionView(ctx: Ctx, route: CollectionRoute): HTMLElement {
  const filtered = ctx.titles
    .filter((t) => matches(t, route.q))
    .filter((t) => route.genre === null || t.genres.includes(route.genre))
    .map((t) => rowOf(ctx, t));
  const sorted = sortRows(filtered, route.sort);
  const { items, page, pages } = paginate(sorted, route.page);
  const isHome = !route.q && !route.genre && route.page === 1 && route.sort === 'popularity';

  const hero = el(
    'section',
    { class: `hero${isHome ? '' : ' hero--compact'}`, 'aria-labelledby': 'hero-title' },
    [
      el('div', { class: 'hero__copy' }, [
        el(
          'h1',
          { class: isHome ? 'display' : 'title-l', id: 'hero-title', tabindex: '-1' },
          isHome
            ? ['Two versions.', el('br'), 'Two scores.']
            : [route.q ? `Results for “${route.q}”` : 'The collection'],
        ),
        isHome &&
          el('p', { class: 'lede' }, [
            'If you are a true otaku you’d know it’s sub all the way, but there are anime with dubs so good they transcend lifetimes. DuborSub gives otakus the community to share their experience with others and help the community improve their viewing experience.',
          ]),
        searchForm(route),
      ]),
      isHome && featured(ctx),
    ],
  );

  const sortTabs = tabs(
    'Sort',
    SORTS.map((s) => ({
      text: s.label,
      href: collectionHash({ ...route, sort: s.key, page: 1 }),
      current: route.sort === s.key,
    })),
  );
  const genreTabs = tabs('Genre', [
    {
      text: 'All',
      href: collectionHash({ ...route, genre: null, page: 1 }),
      current: route.genre === null,
    },
    ...ctx.genres.map((g) => ({
      text: g,
      href: collectionHash({ ...route, genre: g, page: 1 }),
      current: route.genre === g,
    })),
  ]);

  const list =
    items.length > 0
      ? el('div', { class: 'checklist' }, [
          el('div', { class: 'checklist__heads', 'aria-hidden': 'true' }, [
            el('span', { class: 'signage' }, ['Work']),
            el('span', { class: 'signage' }, ['Sub']),
            el('span', { class: 'signage' }, ['Dub']),
            el('span', { class: 'signage' }, ['Leads']),
          ]),
          el(
            'ol',
            { class: 'checklist__rows', start: (page - 1) * 24 + 1 },
            items.map(checklistRow),
          ),
        ])
      : el('div', { class: 'empty' }, [
          el('p', { class: 'title-m' }, ['Nothing in the collection matches.']),
          el('p', { class: 'caption' }, [
            'Try the English or Japanese title, or request it so an admin can add it.',
          ]),
          el('span', { class: 'empty__actions' }, [
            el('a', { class: 'btn btn--line btn--sm', href: '#/' }, ['Clear filters']),
            el('a', { class: 'btn btn--line btn--sm', href: '#/request' }, ['Request a title']),
          ]),
        ]);

  const pager =
    pages > 1
      ? el('nav', { class: 'pager', 'aria-label': 'Pages' }, [
          el('span', { class: 'caption num' }, [`Page ${String(page)} of ${String(pages)}`]),
          el('span', { class: 'pager__links' }, [
            el(
              'a',
              {
                class: `btn btn--line btn--sm${page <= 1 ? ' is-disabled' : ''}`,
                href: collectionHash({ ...route, page: page - 1 }),
                'aria-disabled': page <= 1 ? 'true' : null,
                tabindex: page <= 1 ? '-1' : null,
              },
              ['Previous'],
            ),
            el(
              'a',
              {
                class: `btn btn--line btn--sm${page >= pages ? ' is-disabled' : ''}`,
                href: collectionHash({ ...route, page: page + 1 }),
                'aria-disabled': page >= pages ? 'true' : null,
                tabindex: page >= pages ? '-1' : null,
              },
              ['Next'],
            ),
          ]),
        ])
      : null;

  return el('div', { class: 'view' }, [
    hero,
    el('section', { class: 'collection', 'aria-labelledby': 'collection-title' }, [
      el('header', { class: 'collection__head' }, [
        el('h2', { class: 'title-l', id: 'collection-title' }, ['The collection']),
        el('p', { class: 'caption', role: 'status' }, [plural(sorted.length, 'work')]),
      ]),
      sortTabs,
      genreTabs,
      list,
      pager,
    ]),
  ]);
}

// ---------- Work ----------

export function workView(ctx: Ctx, id: number, flash: string | null): HTMLElement {
  const t = ctx.byId.get(id);
  if (!t) {
    return el('section', { class: 'vacant' }, [
      el('div', { class: 'frame frame--vacant' }, [el('span', { class: 'signage' }, ['Vacant'])]),
      el('h1', { class: 'title-xl', tabindex: '-1' }, ['This work isn’t in the demo.']),
      el('p', { class: 'prose' }, [
        'The demo hangs a sample of the catalogue. Search it, or request the title.',
      ]),
      el('a', { class: 'btn btn--ink', href: '#/' }, ['Back to the collection']),
    ]);
  }
  const stats = ctx.stats(id);
  const split = describeSplit(stats.sub.average, stats.dub.average);
  const mine = ctx.visitor().ratings[String(id)] ?? {};
  const name = displayTitle(t);

  const facts = el('dl', { class: 'facts' }, [
    ...(
      [
        ['Format', formatLabel(t.format)],
        [
          'Year',
          t.year
            ? `${t.season ? `${t.season.charAt(0)}${t.season.slice(1).toLowerCase()} ` : ''}${String(t.year)}`
            : null,
        ],
        ['Episodes', t.episodes ? String(t.episodes) : null],
        ['Studio', t.studio],
        ['Genres', t.genres.join(', ') || null],
      ] as const
    )
      .filter(([, v]) => v)
      .flatMap(([k, v]) => [el('dt', { class: 'signage' }, [k]), el('dd', {}, [v ?? ''])]),
  ]);

  const splitSection = el('section', { class: 'work__section', 'aria-labelledby': 'split-title' }, [
    el('h2', { class: 'title-m', id: 'split-title' }, ['The split ', sampleTag()]),
    el('div', { class: 'split' }, [
      el('div', { class: 'split__col' }, [
        measure('sub', stats.sub, {
          lead: split.lead === 'sub',
          emptyLabel: 'No ratings',
          size: 'split',
        }),
        el('p', { class: 'caption num' }, [plural(stats.sub.count, 'rating')]),
        stats.sub.count > 0 && distribution(stats.sub.distribution, split.lead === 'sub'),
      ]),
      el('div', { class: 'split__col' }, [
        measure('dub', stats.dub, {
          lead: split.lead === 'dub',
          emptyLabel: stats.dubOnRecord ? 'No ratings' : 'Not listed',
          size: 'split',
        }),
        el('p', { class: 'caption num' }, [
          stats.dubOnRecord
            ? plural(stats.dub.count, 'rating')
            : `Dub reported by ${plural(stats.dubReports, 'viewer')}`,
        ]),
        stats.dub.count > 0 && distribution(stats.dub.distribution, split.lead === 'dub'),
      ]),
    ]),
    el('p', { class: 'verdict-sentence' }, [verdictSentence(split, stats.dubOnRecord)]),
  ]);

  const reported = ctx.visitor().reports.includes(id);
  const dubReport = stats.dubOnRecord
    ? null
    : el('div', { class: 'dub-report' }, [
        el('p', {}, [
          reported
            ? `You reported an English dub. ${plural(stats.dubReports, 'report')} of ${String(DUB_THRESHOLD)} needed to put it on record.`
            : 'No English dub is on record for this title yet. Watched one? Say so.',
        ]),
        !reported &&
          (() => {
            const b = el(
              'button',
              { type: 'button', class: 'btn btn--line btn--sm', 'data-focus-key': 'report' },
              ['It has an English dub'],
            );
            b.addEventListener('click', () => {
              ctx.report(id);
            });
            return b;
          })(),
      ]);

  const clear = el('button', { type: 'button', class: 'text-action' }, ['Clear my ratings']);
  clear.addEventListener('click', () => {
    ctx.clearRatings(id);
  });

  const yourRating = el('section', { class: 'work__section', 'aria-labelledby': 'rate-title' }, [
    el('h2', { class: 'title-m', id: 'rate-title', tabindex: '-1' }, ['Your rating']),
    ratingTiles('sub', mine.sub, name, (s) => {
      ctx.rate(id, 'sub', s);
    }),
    stats.dubOnRecord
      ? ratingTiles('dub', mine.dub, name, (s) => {
          ctx.rate(id, 'dub', s);
        })
      : el('p', { class: 'caption' }, ['The dub row opens once a dub is on record.']),
    el('p', { class: 'rate-status', role: 'status', 'aria-live': 'polite' }, [flash ?? '']),
    (mine.sub || mine.dub) && clear,
    dubReport,
    el('p', { class: 'caption' }, [
      'Demo: your ratings and reports are saved in this browser only.',
    ]),
  ]);

  return el('article', { class: 'view work', 'aria-labelledby': 'work-title' }, [
    el('nav', { class: 'crumbs caption', 'aria-label': 'Breadcrumb' }, [
      el('a', { class: 'drawn', href: '#/' }, ['Collection']),
      el('span', { class: 'crumbs__sep', 'aria-hidden': 'true' }, ['/']),
      el('span', { 'aria-current': 'page' }, [name]),
    ]),
    el('div', { class: 'work__grid' }, [
      el('div', { class: 'work__hang' }, [plate(t, 'hung')]),
      el('div', { class: 'work__label' }, [
        el('h1', { class: 'title-xl', id: 'work-title', tabindex: '-1' }, [name]),
        el('p', { class: 'caption provenance' }, [
          [t.native, t.title !== name ? t.title : null].filter(Boolean).join(' · '),
        ]),
        facts,
        splitSection,
        yourRating,
      ]),
    ]),
  ]);
}

// ---------- Request ----------

export function requestView(ctx: Ctx, flash: string | null): HTMLElement {
  const titleInput = el('input', {
    id: 'req-title',
    name: 'title',
    required: true,
    maxlength: 120,
    autocomplete: 'off',
  });
  const noteInput = el('textarea', { id: 'req-note', name: 'note', maxlength: 500, rows: 4 });
  const form = el('form', { class: 'form', novalidate: true }, [
    el('label', { class: 'field' }, [el('span', { class: 'signage' }, ['Title']), titleInput]),
    el('label', { class: 'field' }, [
      el('span', { class: 'signage' }, ['Anything that helps (optional)']),
      noteInput,
    ]),
    el('button', { type: 'submit', class: 'btn btn--ink' }, ['Send request']),
  ]);
  const errorSlot = el('div', {});
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = titleInput.value.trim();
    if (!value) {
      titleInput.setAttribute('aria-invalid', 'true');
      errorSlot.replaceChildren(notice('error', 'Give the title so an admin can find it.'));
      titleInput.focus();
      return;
    }
    ctx.request(value, noteInput.value.trim());
  });
  titleInput.addEventListener('input', () => {
    titleInput.removeAttribute('aria-invalid');
    errorSlot.replaceChildren();
  });

  const mine = ctx.visitor().requests;
  return el('section', { class: 'view request', 'aria-labelledby': 'req-h' }, [
    el('h1', { class: 'title-xl', id: 'req-h', tabindex: '-1' }, ['Request a title']),
    el('p', { class: 'lede' }, [
      'Missing something? In the full app, requests join a queue that admins review before keying the title in.',
    ]),
    flash ? notice('klein', flash) : errorSlot,
    form,
    mine.length > 0 &&
      el('section', { class: 'work__section' }, [
        el('h2', { class: 'title-m' }, ['Your requests (this browser)']),
        el(
          'ul',
          { class: 'requests' },
          mine.map((r) =>
            el('li', {}, [el('strong', {}, [r.title]), r.note ? ` · ${r.note}` : '']),
          ),
        ),
      ]),
  ]);
}
