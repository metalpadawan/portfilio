/**
 * AniRate signature components for the demo (DESIGN.md: Measure, Work Frame and Plate,
 * Rating Tiles, Notices). All text goes through el()/textContent.
 */
import { el } from '../../ui/dom';
import {
  displayTitle,
  formatLabel,
  formatScore,
  type Distribution,
  type Measure,
  type Score,
  type Title,
  type Version,
} from './model';

const VERSION_NAME: Record<Version, string> = { sub: 'Sub', dub: 'Dub' };

/** A score set as a measurement: name + tabular figure over a ruled track scaled to five. */
export function measure(
  version: Version,
  m: Measure,
  opts: { lead: boolean; emptyLabel: string; size?: 'row' | 'split'; showName?: boolean },
): HTMLElement {
  const size = opts.size ?? 'row';
  const root = el('div', {
    class: `measure measure--${size}${opts.lead ? ' measure--lead' : ''}${m.average === null ? ' measure--empty' : ''}`,
  });
  const name = el(
    'span',
    { class: `signage${opts.showName === false ? ' visually-hidden' : ''}` },
    [VERSION_NAME[version]],
  );
  if (m.average === null) {
    root.append(name, el('span', { class: 'measure__empty' }, [opts.emptyLabel]));
    return root;
  }
  const figure = el('span', { class: 'measure__fig num' }, [
    formatScore(m.average),
    el('span', { class: 'visually-hidden' }, [' out of 5']),
  ]);
  const track = el('span', { class: 'measure__track', 'aria-hidden': 'true' }, [
    el('span', { class: 'measure__fill' }),
  ]);
  track.style.setProperty('--fill', `${String((m.average / 5) * 100)}%`);
  root.append(el('span', { class: 'measure__top' }, [name, figure]), track);
  return root;
}

/** Five ruled steps per version, scaled to the most common score. */
export function distribution(dist: Distribution, lead: boolean): HTMLElement {
  const max = Math.max(1, ...dist);
  const list = el('ol', { class: `dist${lead ? ' dist--lead' : ''}`, reversed: true });
  for (let score = 5; score >= 1; score--) {
    const n = dist[score - 1] ?? 0;
    const bar = el('span', { class: 'dist__bar', 'aria-hidden': 'true' }, [
      el('span', { class: 'dist__fill' }),
    ]);
    bar.style.setProperty('--fill', `${String((n / max) * 100)}%`);
    list.append(
      el('li', { class: 'dist__row' }, [
        el('span', { class: 'dist__score num' }, [String(score)]),
        bar,
        el('span', { class: 'dist__count num' }, [
          String(n),
          el('span', { class: 'visually-hidden' }, [n === 1 ? ' vote' : ' votes']),
        ]),
      ]),
    );
  }
  return list;
}

/** 2:3 work frame with a typeset plate fallback: never a broken image. */
export function plate(t: Title, size: 'thumb' | 'hung'): HTMLElement {
  const frame = el('div', { class: `frame frame--${size}` });
  const fallback = (): void => {
    frame.replaceChildren(
      size === 'thumb'
        ? el('span', { class: 'plate plate--thumb', 'aria-hidden': 'true' }, [
            displayTitle(t).charAt(0),
          ])
        : el('div', { class: 'plate plate--hung' }, [
            el(
              'span',
              { class: 'plate__words' },
              displayTitle(t)
                .split(/\s+/)
                .slice(0, 6)
                .map((w) => el('span', {}, [w])),
            ),
            el('span', { class: 'plate__foot signage' }, ['No cover on record']),
          ]),
    );
  };
  if (!t.cover) {
    fallback();
    return frame;
  }
  const img = el('img', {
    src: t.cover,
    alt: size === 'hung' ? `Cover of ${displayTitle(t)}` : '',
    loading: size === 'thumb' ? 'lazy' : 'eager',
    decoding: 'async',
    referrerpolicy: 'no-referrer',
    width: size === 'thumb' ? 56 : 460,
    height: size === 'thumb' ? 84 : 690,
  });
  img.addEventListener('error', fallback, { once: true });
  frame.append(img);
  return frame;
}

export function sampleTag(): HTMLElement {
  return el('span', { class: 'sample-tag', title: 'Illustrative sample figures' }, ['Sample']);
}

export function metaLine(t: Title): HTMLElement {
  const parts = [
    formatLabel(t.format),
    t.year ? String(t.year) : null,
    t.episodes ? `${String(t.episodes)} ep` : null,
    t.studio,
  ].filter((p): p is string => !!p);
  return el(
    'span',
    { class: 'meta' },
    parts.map((p) => el('span', { class: 'meta__item' }, [p])),
  );
}

/** Five numbered toggle tiles for one version, in a labelled group. */
export function ratingTiles(
  version: Version,
  current: Score | undefined,
  titleName: string,
  onPick: (score: Score) => void,
): HTMLElement {
  const group = el('div', {
    class: 'tiles',
    role: 'group',
    'aria-label': `${VERSION_NAME[version]} rating for ${titleName}`,
  });
  for (const score of [1, 2, 3, 4, 5] as const) {
    const tile = el(
      'button',
      {
        type: 'button',
        class: 'tile num',
        'aria-pressed': String(current === score),
        'aria-label': `${String(score)} of 5`,
        'data-focus-key': `tile-${version}-${String(score)}`,
      },
      [String(score)],
    );
    tile.addEventListener('click', () => {
      onPick(score);
    });
    group.append(tile);
  }
  return el('div', { class: 'tiles-row' }, [
    el('span', { class: 'signage' }, [VERSION_NAME[version]]),
    group,
  ]);
}

export function notice(tone: 'klein' | 'error', text: string): HTMLElement {
  return el('p', { class: `notice notice--${tone}`, role: 'status' }, [text]);
}
