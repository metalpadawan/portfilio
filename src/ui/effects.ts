/** Motion helpers for the DOM layer. All respect prefers-reduced-motion. */

const reducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let observer: IntersectionObserver | null = null;
/** Keys of cards already revealed, so re-renders (filters, live data) don't replay the entrance. */
const revealed = new Set<string>();

/** Fade/slide elements in as they enter the viewport. Safe to call repeatedly. */
export function observeReveal(root: ParentNode): void {
  const all = root.querySelectorAll<HTMLElement>(
    '[data-reveal]:not(.is-visible), .card:not(.is-visible)',
  );
  const targets: HTMLElement[] = [];
  for (const node of all) {
    const key = node.dataset['key'];
    if (key && revealed.has(key)) node.classList.add('is-visible');
    else targets.push(node);
  }
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((t) => {
      t.classList.add('is-visible');
    });
    return;
  }
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        const key = (entry.target as HTMLElement).dataset['key'];
        if (key) revealed.add(key);
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  targets.forEach((t) => observer?.observe(t));
}

/**
 * 3D tilt + cursor spotlight on cards, via one delegated listener per container.
 * Only for fine pointers (mouse/trackpad); writes CSS custom properties, CSS does the rest.
 */
export function enableTilt(container: HTMLElement, maxDeg = 6): void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let active: HTMLElement | null = null;
  let frame = 0;
  let last: PointerEvent | null = null;

  const apply = (): void => {
    frame = 0;
    if (!active || !last) return;
    const rect = active.getBoundingClientRect();
    const x = (last.clientX - rect.left) / rect.width; // 0..1
    const y = (last.clientY - rect.top) / rect.height;
    active.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    active.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    if (!reducedMotion()) {
      active.style.setProperty('--ry', `${((x - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
      active.style.setProperty('--rx', `${((0.5 - y) * 2 * maxDeg).toFixed(2)}deg`);
    }
  };

  const reset = (card: HTMLElement): void => {
    card.style.removeProperty('--rx');
    card.style.removeProperty('--ry');
    card.classList.remove('is-hovered');
  };

  container.addEventListener('pointermove', (e) => {
    const card = (e.target as Element).closest<HTMLElement>('[data-tilt]');
    if (card !== active) {
      if (active) reset(active);
      active = card;
      active?.classList.add('is-hovered');
    }
    last = e;
    if (!frame) frame = requestAnimationFrame(apply);
  });
  container.addEventListener('pointerleave', () => {
    if (active) reset(active);
    active = null;
  });
}

/** Counts stat numbers up from 0 once visible. */
export function animateCounters(root: ParentNode): void {
  const nodes = root.querySelectorAll<HTMLElement>('[data-count]');
  if (reducedMotion()) return;
  nodes.forEach((node) => {
    const target = Number(node.dataset['count'] ?? '0');
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      node.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
