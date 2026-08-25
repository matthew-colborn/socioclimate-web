/**
 * Drives the four-move graphic on /what-we-do.
 *
 * Scroll is what sets the state: whichever move is nearest the middle of the
 * viewport is the state the particle system moves toward. Scroll reads best
 * here because the steps are a sequence and reading them in order is already
 * the interaction — hover would demand the visitor discover it, and focus alone
 * would only ever fire for keyboard users.
 *
 * Until someone scrolls, the scene runs itself, so the story tells itself to a
 * visitor who lands and does nothing.
 *
 * Nothing here gates content. The text is fully readable and every step is
 * reachable with this module absent or broken; all it does is move a number
 * that a canvas reads.
 */
import { state } from './scenes/process';

const STEPS = ['01-find', '02-capture', '03-understand', '04-revenue'];

export function initProcess(): void {
  const root = document.querySelector<HTMLElement>('[data-process]');
  if (!root) return;

  const steps = STEPS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  if (steps.length !== STEPS.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // The scene stays on the resolved ridge and the anchors still work, which
    // is all this needs to do. Nothing below runs.
    return;
  }

  /** Jump straight to a state without playing the ones before it. */
  const snap = (i: number): void => {
    state.auto = false;
    state.cur = i;
    state.target = i;
  };

  const fromHash = (): number => STEPS.indexOf(location.hash.replace('#', ''));

  const initial = fromHash();
  if (initial >= 0) snap(initial);

  window.addEventListener('hashchange', () => {
    const i = fromHash();
    if (i >= 0) snap(i);
  });

  // A click on an in-page link to a step counts as entering it directly.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]');
    if (!a) return;
    const i = STEPS.indexOf((a.getAttribute('href') || '').slice(1));
    if (i >= 0) snap(i);
  });

  // Whichever step is closest to the middle of the viewport wins.
  let ticking = false;
  const pick = (): void => {
    ticking = false;
    const mid = window.innerHeight / 2;
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < steps.length; i++) {
      const r = steps[i].getBoundingClientRect();
      // Skip steps entirely off screen so scrolling past the section does not
      // drag the state to whichever end happens to be nearer.
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0) {
      state.auto = false;
      state.target = best;
    }
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(pick);
    },
    { passive: true }
  );

  // Keyboard users tabbing through the steps get the same behaviour.
  for (let i = 0; i < steps.length; i++) {
    steps[i].addEventListener('focusin', () => {
      state.auto = false;
      state.target = i;
    });
  }
}
