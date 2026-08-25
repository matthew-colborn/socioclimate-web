/**
 * Mounts every scene on the page.
 *
 * Replaces the hero carousel. The site now shows one scene per place it means
 * something — the flame on the home page, and one per portfolio entry — rather
 * than rotating six of them past a visitor in a single hero. Each canvas is
 * independent, and the Engine's IntersectionObserver keeps the off-screen ones
 * from burning frames.
 *
 * The poster image carries first paint. Canvas work starts after load, so a
 * slow device shows the composed scene immediately and gains motion late rather
 * than waiting on script for anything visible.
 */
import { Engine, prefersReducedMotion } from './engine';
import { SCENES, SEEDS, type SceneId } from '../scenes/registry';

/** The scene draws itself in rather than appearing complete. */
const DRAW_MS = 900;

export function mountFields(scope: ParentNode = document): void {
  const canvases = Array.from(scope.querySelectorAll<HTMLCanvasElement>('canvas[data-field]'));
  if (!canvases.length) return;

  const reduced = prefersReducedMotion();
  const engines: Engine[] = [];

  for (const canvas of canvases) {
    const id = canvas.dataset.field as SceneId;
    const scene = SCENES[id];
    // An unknown id is a content error, not a reason to throw on the client.
    if (!scene) continue;

    const engine = new Engine({ canvas, scene, seed: SEEDS[id], still: reduced });
    engines.push(engine);

    if (reduced) {
      // Frozen at t=0 through the same code path as the animated scene.
      engine.renderOnce(0);
    } else {
      engine.intro = 0;
      engine.play();
      const t0 = performance.now();
      const ramp = (): void => {
        const k = Math.min(1, (performance.now() - t0) / DRAW_MS);
        engine.intro = k;
        if (k < 1) requestAnimationFrame(ramp);
      };
      requestAnimationFrame(ramp);
    }

    // Hands the surface over from the poster to the canvas.
    canvas.closest('.field')?.classList.add('is-live');
  }

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => engines.forEach((e) => e.resize()), 150);
  });
}
