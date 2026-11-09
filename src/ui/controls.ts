import { CATEGORIES, DEFAULT_FILTER, SORT_KEYS, filterToQuery } from '../projects/filter';
import type { Category, FilterState, SortKey } from '../types';
import { el } from './dom';
import { languageColor } from './languages';

export interface ControlsElements {
  search: HTMLInputElement;
  sort: HTMLSelectElement;
  languages: HTMLElement;
  categories: HTMLElement;
  clear: HTMLButtonElement;
}

const SORT_LABELS: Record<SortKey, string> = {
  updated: 'Recently updated',
  created: 'Newest',
  name: 'Name (A–Z)',
  stars: 'Most stars',
};

function chip(label: string, pressed: boolean, value: string, color?: string): HTMLButtonElement {
  const button = el('button', {
    type: 'button',
    class: 'chip',
    'aria-pressed': String(pressed),
    'data-value': value,
  });
  if (color) {
    const dot = el('span', { class: 'lang__dot', 'aria-hidden': 'true' });
    dot.style.setProperty('--lang', color);
    button.appendChild(dot);
  }
  button.append(label);
  return button;
}

/**
 * Wires search / sort / chip filters (SPEC F4) and keeps the URL in sync (F9).
 * Returns `setLanguages` so chips can be rebuilt when live data adds a language.
 */
export function initControls(
  els: ControlsElements,
  initial: FilterState,
  onChange: (state: FilterState) => void,
): { setLanguages: (langs: readonly string[]) => void; getState: () => FilterState } {
  let state: FilterState = { ...initial };
  let debounce = 0;

  const commit = (next: Partial<FilterState>): void => {
    state = { ...state, ...next };
    syncChips();
    history.replaceState(null, '', `${location.pathname}${filterToQuery(state)}${location.hash}`);
    onChange(state);
  };

  // Sort select
  els.sort.replaceChildren(
    ...SORT_KEYS.map((k) =>
      el('option', { value: k, selected: k === state.sort }, [SORT_LABELS[k]]),
    ),
  );
  els.sort.addEventListener('change', () => {
    const value = SORT_KEYS.find((k) => k === els.sort.value) ?? DEFAULT_FILTER.sort;
    commit({ sort: value });
  });

  // Search: debounced while typing, immediate on Enter (audit fix I).
  els.search.value = state.query;
  els.search.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      commit({ query: els.search.value.trim() });
    }, 120);
  });
  els.search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    window.clearTimeout(debounce);
    commit({ query: els.search.value.trim() });
  });

  // Category chips (static)
  els.categories.replaceChildren(
    chip('All', state.category === null, ''),
    ...CATEGORIES.map((c) => chip(c, state.category === c, c)),
  );
  els.categories.addEventListener('click', (e) => {
    const target = (e.target as Element).closest<HTMLButtonElement>('button.chip');
    if (!target) return;
    const value = target.dataset['value'] ?? '';
    const category: Category | null = CATEGORIES.find((c) => c === value) ?? null;
    commit({ category });
  });

  // Language chips (rebuilt when data changes)
  const setLanguages = (langs: readonly string[]): void => {
    els.languages.replaceChildren(
      chip('All', state.language === null, ''),
      ...langs.map((l) => chip(l, state.language === l, l, languageColor(l))),
    );
  };
  els.languages.addEventListener('click', (e) => {
    const target = (e.target as Element).closest<HTMLButtonElement>('button.chip');
    if (!target) return;
    commit({ language: target.dataset['value'] || null });
  });

  els.clear.addEventListener('click', () => {
    els.search.value = '';
    els.sort.value = DEFAULT_FILTER.sort;
    commit({ ...DEFAULT_FILTER });
    els.search.focus();
  });

  function syncChips(): void {
    for (const b of els.categories.querySelectorAll<HTMLButtonElement>('button.chip')) {
      b.setAttribute('aria-pressed', String((b.dataset['value'] || null) === state.category));
    }
    for (const b of els.languages.querySelectorAll<HTMLButtonElement>('button.chip')) {
      b.setAttribute('aria-pressed', String((b.dataset['value'] || null) === state.language));
    }
  }

  return { setLanguages, getState: () => state };
}
