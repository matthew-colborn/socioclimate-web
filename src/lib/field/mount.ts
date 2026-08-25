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
import { Engine, prefersReducedMotion, beginSession } from './engine';
import { wireViewer } from './life';
import { SCENES, SEEDS, type SceneId } from '../scenes/registry';

/** The scene draws itself in rather than appearing complete. */
const DRAW_MS = 900;

/** Below this share of itself on screen, a field is not worth animating. */
const MIN_RATIO = 0.12;

interface Mounted {
  /** Null until the field has come near the viewport. See `ensure`. */
  engine: Engine | null;
  canvas: HTMLCanvasElement;
  id: SceneId;
  el: HTMLElement;
  ratio: number;
  ramped: boolean;
  reduced: boolean;
}

/**
 * Construct on approach, not on load.
 *
 * The whole site is one page now, so every canvas on it exists in the document
 * from the start. Building eight engines up front means eight scene inits and
 * eight first paints before anything has been scrolled to, which is time spent
 * on work nobody can see yet. Space is reserved by the aspect-ratio on .field,
 * so nothing shifts when one of these finally arrives.
 */
function ensure(it: Mounted): Engine | null {
  if (it.engine) return it.engine;
  const scene = SCENES[it.id];
  if (!scene) return null;
  it.engine = new Engine({
    canvas: it.canvas, scene, seed: SEEDS[it.id], still: it.reduced,
  });
  if (!it.reduced) it.engine.hold();
  it.el.classList.add('is-live');
  return it.engine;
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
    if (it.ratio < MIN_RATIO || !it.engine) continue;
    if (!best || it.ratio > best.ratio) best = it;
  }
  if (best === active) return;

  // The outgoing field holds its last painted frame rather than clearing.
  if (active?.engine) active.engine.hold();
  active = best;
  if (!active || !active.engine) return;

  const current = active as Mounted & { engine: Engine };
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
        if (!it) continue;
        it.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        // Anything the observer reports at all is within rootMargin, which is
        // the cue to build it. Under reduced motion this draws its one still.
        if (entry.isIntersecting) ensure(it);
      }
      govern();
    },
    // A spread of thresholds, so "which is most visible" is answered with real
    // numbers as the page scrolls rather than by a single on/off flip.
    {
      threshold: [0, 0.12, 0.25, 0.4, 0.6, 0.8, 1],
      // Build a field roughly half a screen before it is reached, so it is
      // ready by the time it matters and idle until then.
      rootMargin: '45% 0px 45% 0px',
    }
  );
  return io;
}

/** Put an engine mounted elsewhere under the same one-at-a-time rule. */
export function registerField(engine: Engine, el: HTMLElement): void {
  if (prefersReducedMotion()) return;
  engine.hold();
  items.push({
    engine, el, ratio: 0, ramped: true, reduced: false,
    canvas: el.querySelector('canvas') as HTMLCanvasElement, id: 'flame' as SceneId,
  });
  observer().observe(el);
}

export function mountFields(scope: ParentNode = document): void {
  // With view transitions this runs again on every navigation, so anything
  // pointing at a canvas the router has already removed has to be stopped and
  // dropped. Without this the registry accumulates dead engines across a visit
  // and the governor starts choosing between fields that are no longer there.
  for (let i = items.length - 1; i >= 0; i--) {
    if (!items[i].el.isConnected) {
      items[i].engine?.stop();
      if (active === items[i]) active = null;
      io?.unobserve(items[i].el);
      items.splice(i, 1);
    }
  }

  const canvases = Array.from(scope.querySelectorAll<HTMLCanvasElement>('canvas[data-field]'));
  if (!canvases.length) return;

  // A canvas already under management is left alone, so returning to a route
  // does not double-mount it.
  const known = new Set(items.map((it) => it.el));

  const reduced = prefersReducedMotion();
  beginSession(reduced);
  wireViewer(reduced);

  for (const canvas of canvases) {
    const id = canvas.dataset.field as SceneId;
    const scene = SCENES[id];
    // An unknown id is a content error, not a reason to throw on the client.
    if (!scene) continue;

    const el = (canvas.closest('.field') as HTMLElement) ?? canvas;
    if (known.has(el)) continue;

    // Registered, not built. `ensure` constructs it when it comes near.
    items.push({ engine: null, canvas, id, el, ratio: 0, ramped: false, reduced });
  }

  if (!items.length) return;

  items.forEach((it) => observer().observe(it.el));
  if (reduced) return;
  govern();

  let rt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => items.forEach((it) => it.engine?.resize()), 150);
  });

  // Nothing runs while the tab is hidden.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) items.forEach((it) => it.engine?.hold());
    else if (active?.engine) active.engine.play();
  });
}
