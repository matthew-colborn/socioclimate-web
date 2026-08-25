/**
 * The page background.
 *
 * One fixed, full-viewport canvas behind everything, running the wave surface
 * from beneath the flame. It is deliberately outside the governor: the governor
 * picks the single most-visible FOCAL field, and this is not a focal field —
 * it is the ground the focal one sits on. It stays legal under the
 * one-moving-thing rule only because it is quiet enough not to compete, which
 * is a property of its alpha, not of its position in a list.
 *
 * It still obeys everything else: frozen under prefers-reduced-motion, stopped
 * when the tab is hidden, and capped well below the focal frame rate.
 */
import { Engine, prefersReducedMotion, beginSession } from './engine';
import { SCENES, SEEDS } from '../scenes/registry';

/** Slower than the focal cap. Nothing here moves fast enough to need more. */
const BACKDROP_FPS = 20;

let engine: Engine | undefined;

export function initBackdrop(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-backdrop]');
  if (!canvas || engine) return;

  const reduced = prefersReducedMotion();
  beginSession(reduced);

  engine = new Engine({
    canvas,
    scene: SCENES.waves,
    seed: SEEDS.waves,
    still: reduced,
    fps: BACKDROP_FPS,
  });

  if (reduced) return;
  engine.play();

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => engine?.resize(), 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) engine?.hold();
    else engine?.play();
  });
}
