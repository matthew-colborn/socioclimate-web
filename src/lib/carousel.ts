/**
 * The hero carousel.
 *
 * Follows the ARIA APG carousel pattern. Three rules it will not break:
 *   1. Nothing animates and nothing auto-advances under prefers-reduced-motion.
 *   2. Focus is never trapped — every control is an ordinary button in flow.
 *   3. The readouts are DOM text. The canvas is decorative and aria-hidden.
 *
 * The poster image carries first paint. Canvas work only starts after load, so
 * a slow device shows the composed scene immediately and gains motion late,
 * rather than waiting on script for anything visible.
 */
import { Engine, prefersReducedMotion } from './field/engine';
import { SCENES, SEEDS, type SceneId } from './scenes/registry';

// Six scenes at 7.2s is a 43-second loop, and almost nobody stays on a hero
// that long — the last two scenes would effectively never be seen. 5.4s brings
// the full loop to 32 seconds, which is still long but puts the invitation
// inside a plausible visit. The numbered controls, not the interval, are what
// actually make scene 05 reachable.
const ADVANCE_MS = 5400;
const FADE_MS = 760;

interface Slide {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  poster: HTMLElement | null;
  id: SceneId;
  engine?: Engine;
}

export function initCarousel(root: HTMLElement): void {
  const slides: Slide[] = Array.from(
    root.querySelectorAll<HTMLElement>('[data-slide]')
  ).map((el) => ({
    root: el,
    canvas: el.querySelector('canvas')!,
    poster: el.querySelector<HTMLElement>('[data-poster]'),
    id: el.dataset.scene as SceneId,
  }));
  if (!slides.length) return;

  const live = root.querySelector<HTMLElement>('[data-live]');
  const count = root.querySelector<HTMLElement>('[data-count]');
  const pauseBtn = root.querySelector<HTMLButtonElement>('[data-pause]');
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-goto]'));
  const reduced = prefersReducedMotion();

  let index = 0;
  let playing = !reduced;
  let timer = 0;

  function ensureEngine(s: Slide): void {
    if (s.engine) return;
    s.engine = new Engine({
      canvas: s.canvas,
      scene: SCENES[s.id],
      seed: SEEDS[s.id],
      still: reduced,
    });
  }

  function show(next: number, announce: boolean): void {
    const prev = index;
    index = (next + slides.length) % slides.length;

    slides.forEach((s, i) => {
      const on = i === index;
      s.root.classList.toggle('is-on', on);
      s.root.setAttribute('aria-hidden', on ? 'false' : 'true');
      // Off-screen slides must not be reachable by keyboard.
      s.root.querySelectorAll<HTMLElement>('a, button').forEach((el) => {
        if (on) el.removeAttribute('tabindex');
        else el.setAttribute('tabindex', '-1');
      });
    });

    dots.forEach((d, i) => {
      d.setAttribute('aria-current', i === index ? 'true' : 'false');
    });
    // The visible counter matches the dot labels, which are zero-based —
    // 00 is the statement, 05 the invitation. The aria label stays
    // one-based ("1 of 6") because that is what a screen reader expects.
    if (count) count.textContent = String(index).padStart(2, '0');

    const s = slides[index];
    ensureEngine(s);
    if (!reduced) {
      s.engine!.intro = 0;
      s.engine!.play();
      const t0 = performance.now();
      const ramp = () => {
        const k = Math.min(1, (performance.now() - t0) / FADE_MS);
        s.engine!.intro = k;
        if (k < 1) requestAnimationFrame(ramp);
      };
      requestAnimationFrame(ramp);
      if (prev !== index) slides[prev].engine?.pause();
    }
    // The poster stays until the canvas has something on it.
    if (s.poster) s.poster.classList.add('is-faded');

    if (announce && live) {
      live.textContent = `Scene ${index + 1} of ${slides.length}: ${s.root.dataset.title ?? ''}`;
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
      pauseBtn.querySelector('[data-pause-label]')!.textContent = playing ? 'Pause' : 'Play';
    }
    // APG: announce slide changes only when rotation is stopped.
    if (live) live.setAttribute('aria-live', playing ? 'off' : 'polite');
    if (playing) schedule();
    else clearTimeout(timer);
  }

  pauseBtn?.addEventListener('click', () => setPlaying(!playing));
  dots.forEach((d, i) =>
    d.addEventListener('click', () => {
      setPlaying(false);
      show(i, true);
    })
  );

  // A CTA of the form #scene-N drives the rotation instead of navigating, so
  // the statement scene can hand off to the first piece of proof.
  root.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-cta]');
    if (!a) return;
    const m = /^#scene-(\d+)$/.exec(a.getAttribute('href') || '');
    if (!m) return;
    e.preventDefault();
    setPlaying(false);
    show(Number(m[1]), true);
  });

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!(e.target as HTMLElement).closest('[data-goto]')) return;
    e.preventDefault();
    setPlaying(false);
    show(index + (e.key === 'ArrowRight' ? 1 : -1), true);
    dots[index]?.focus();
  });

  // Stop burning frames when the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else schedule();
  });

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => slides.forEach((s) => s.engine?.resize()), 150);
  });

  root.classList.add('is-ready');
  if (reduced) {
    // Freeze: render every scene's still, no advance, and hide the controls
    // that only make sense for motion.
    slides.forEach((s) => {
      ensureEngine(s);
      s.engine!.renderOnce(0);
    });
    pauseBtn?.setAttribute('hidden', '');
    if (live) live.setAttribute('aria-live', 'polite');
    show(0, false);
    return;
  }

  show(0, false);
  setPlaying(true);
}
