/**
 * The home hero rotation.
 *
 * What cycles is the argument, not the work. The flame underneath never
 * restarts — it is one continuously running scene, and the thesis moves through
 * it. That is the difference between this and the carousel it replaces: the old
 * one swapped six scenes and re-told the portfolio, which now has its own page.
 *
 * Nothing is gated behind the rotation. The call to action and the navigation
 * sit outside it and never change, so a visitor is never waiting on a beat to
 * come round in order to reach something.
 *
 * Three rules it will not break:
 *   1. Nothing auto-advances under prefers-reduced-motion.
 *   2. Focus is never trapped — the beats contain no controls, only text, and
 *      every control is an ordinary button in flow beneath them.
 *   3. The readouts are DOM text. The canvas is decorative and aria-hidden.
 */
import { prefersReducedMotion } from './field/engine';

/**
 * 4.5s a beat, four beats, an 18-second loop.
 *
 * The old rotation was six scenes at 5.4s — 32 seconds, which meant the last
 * beat effectively never got seen. 4.5s is comfortably longer than it takes to
 * read a short headline and one supporting line, and the whole argument now
 * comes round in less time than the old loop took to reach its halfway point.
 */
const ADVANCE_MS = 4500;

export function initThesis(root: HTMLElement): void {
  const beats = Array.from(root.querySelectorAll<HTMLElement>('[data-beat]'));
  if (beats.length < 2) return;

  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-beat-goto]'));
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-beat-pause]');
  const live = root.querySelector<HTMLElement>('[data-beat-live]');
  const reduced = prefersReducedMotion();

  let index = 0;
  let playing = !reduced;
  let timer = 0;

  function show(next: number, announce: boolean): void {
    index = (next + beats.length) % beats.length;
    beats.forEach((b, i) => {
      const on = i === index;
      b.classList.toggle('is-on', on);
      // Inactive beats are still in the layout — they are what makes the block
      // as tall as the tallest one — so they have to be hidden from assistive
      // tech explicitly rather than by being absent.
      b.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    dots.forEach((d, i) => d.setAttribute('aria-current', i === index ? 'true' : 'false'));
    if (announce && live) {
      live.textContent = `Beat ${index + 1} of ${beats.length}: ${beats[index].dataset.beat ?? ''}`;
    }
  }

  function schedule(): void {
    clearTimeout(timer);
    if (!playing || reduced) return;
    timer = window.setTimeout(() => {
      show(index + 1, false);
      schedule();
    }, ADVANCE_MS);
  }

  function setPlaying(next: boolean): void {
    playing = next;
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', String(!playing));
      const label = pauseBtn.querySelector('[data-beat-pause-label]');
      if (label) label.textContent = playing ? 'Pause' : 'Play';
    }
    // APG: announce changes only when rotation is stopped, or the live region
    // interrupts a screen reader every few seconds unprompted.
    if (live) live.setAttribute('aria-live', playing ? 'off' : 'polite');
    if (playing) schedule();
    else clearTimeout(timer);
  }

  dots.forEach((d, i) =>
    d.addEventListener('click', () => {
      setPlaying(false);
      show(i, true);
    })
  );

  pauseBtn?.addEventListener('click', () => setPlaying(!playing));

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!(e.target as HTMLElement).closest('[data-beat-goto]')) return;
    e.preventDefault();
    setPlaying(false);
    show(index + (e.key === 'ArrowRight' ? 1 : -1), true);
    dots[index]?.focus();
  });

  // Hovering or focusing the copy stops the rotation moving out from under
  // someone who is mid-sentence. It resumes when they leave.
  const hoverTarget = root.querySelector<HTMLElement>('[data-beat-stack]');
  hoverTarget?.addEventListener('pointerenter', () => { if (playing) clearTimeout(timer); });
  hoverTarget?.addEventListener('pointerleave', () => { if (playing) schedule(); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else schedule();
  });

  root.classList.add('is-ready');

  if (reduced) {
    // Frozen on the first beat. The dots still navigate, so the whole argument
    // stays reachable without any motion at all.
    show(0, false);
    pauseBtn?.setAttribute('hidden', '');
    if (live) live.setAttribute('aria-live', 'polite');
    return;
  }

  show(0, false);
  setPlaying(true);
}
