/**
 * Mounts every scene on the page, and enforces the one rule that keeps this
 * from turning into a screensaver: at most one field animates at a time.
 *
 * The references look expensive because of restraint — a single focal object
 * against a lot of empty space. A page with four scenes running at once reads
 * as decoration rather than as engineering. So this is a governor and not a
 * hope: an IntersectionObserver tracks how much of each field is on screen, and
 * only the most-visible one is allowed to run. Every other field holds its last
 * painted frame, which is a still, which is what it should look like anyway.
 *
 * The poster image carries first paint. Canvas work starts after load, so a
 * slow device shows the composed scene immediately and gains motion late rather
 * than waiting on script for anything visible.
 */
import { Engine, prefersReducedMotion } from './engine';
import { SCENES, SEEDS, type SceneId } from '../scenes/registry';

/** The scene draws itself in rather than appearing complete. */
const DRAW_MS = 900;

/** Below this share of itself on screen, a field is not worth animating. */
const MIN_RATIO = 0.12;

interface Mounted {
  engine: Engine;
  el: HTMLElement;
  ratio: number;
  ramped: boolean;
}

/**
 * One list and one governor per page. The diagnostic mounts its own engine and
 * registers it here, so /contact cannot end up running its header scene and the
 * field behind the questions at the same time.
 */
const items: Mounted[] = [];
let active: Mounted | null = null;
let io: IntersectionObserver | null = null;

function govern(): void {
  let best: Mounted | null = null;
  for (const it of items) {
    if (it.ratio < MIN_RATIO) continue;
    if (!best || it.ratio > best.ratio) best = it;
  }
  if (best === active) return;

  // The outgoing field holds its last painted frame rather than clearing.
  if (active) active.engine.hold();
  active = best;
  if (!active) return;

  const current = active;
  current.engine.play();
  if (!current.ramped) {
    current.ramped = true;
    current.engine.intro = 0;
    const t0 = performance.now();
    const ramp = (): void => {
      const k = Math.min(1, (performance.now() - t0) / DRAW_MS);
      current.engine.intro = k;
      if (k < 1) requestAnimationFrame(ramp);
    };
    requestAnimationFrame(ramp);
  }
}

function observer(): IntersectionObserver {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const it = items.find((x) => x.el === entry.target);
        if (it) it.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      }
      govern();
    },
    // A spread of thresholds, so "which is most visible" is answered with real
    // numbers as the page scrolls rather than by a single on/off flip.
    { threshold: [0, 0.12, 0.25, 0.4, 0.6, 0.8, 1] }
  );
  return io;
}

/** Put an engine mounted elsewhere under the same one-at-a-time rule. */
export function registerField(engine: Engine, el: HTMLElement): void {
  if (prefersReducedMotion()) return;
  engine.hold();
  items.push({ engine, el, ratio: 0, ramped: true });
  observer().observe(el);
}

export function mountFields(scope: ParentNode = document): void {
  const canvases = Array.from(scope.querySelectorAll<HTMLCanvasElement>('canvas[data-field]'));
  if (!canvases.length) return;

  const reduced = prefersReducedMotion();

  for (const canvas of canvases) {
    const id = canvas.dataset.field as SceneId;
    const scene = SCENES[id];
    // An unknown id is a content error, not a reason to throw on the client.
    if (!scene) continue;

    const engine = new Engine({ canvas, scene, seed: SEEDS[id], still: reduced });
    const el = (canvas.closest('.field') as HTMLElement) ?? canvas;
    if (!reduced) engine.hold();
    items.push({ engine, el, ratio: 0, ramped: false });

    // Hands the surface over from the poster to the canvas. Under reduced
    // motion the Engine has already drawn its single frame in the constructor.
    el.classList.add('is-live');
  }

  if (reduced || !items.length) return;

  items.forEach((it) => observer().observe(it.el));
  govern();

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => items.forEach((it) => it.engine.resize()), 150);
  });

  // Nothing runs while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) items.forEach((it) => it.engine.hold());
    else if (active) active.engine.play();
  });
}
