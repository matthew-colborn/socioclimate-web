/**
 * The 2D canvas runtime every scene shares.
 *
 * Deliberately not WebGL. Every scene is a 2D composition — a ridge, routed
 * traces, converging particles, interlocking lattices — so a GL context buys
 * nothing and costs context-loss handling, shader compilation and a second
 * fallback implementation. Canvas is the only path, which means the reduced-
 * motion still and the animated scene are the same code at different times.
 *
 * The one performance rule: never build a gradient inside the frame loop. The
 * glow is one pre-rendered dab drawn with `lighter`. That is what keeps a few
 * thousand additive particles cheap.
 */

import { viewer, decayViewer } from './life';

export interface SceneCtx {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels, not device pixels — the transform already accounts for DPR. */
  w: number;
  h: number;
  /** Deterministic per scene, so a poster frame matches the first animated frame. */
  rng: () => number;
  dab: HTMLCanvasElement;
  /**
   * The viewer, in this canvas's own coordinates. `px`/`py` are -1 when the
   * pointer is elsewhere or absent. `pstr` is 0..1 and decays, so a parked
   * cursor stops mattering rather than holding the field deformed. `idle`
   * climbs once nobody has interacted for a while. All three are 0 / -1 under
   * prefers-reduced-motion, so a scene that reads them still freezes.
   */
  px: number;
  py: number;
  pstr: number;
  idle: number;
  /** Per-scene phase, so nothing on the page breathes in lockstep. */
  phase: number;
}

export interface Scene {
  /** Called on first mount and on every resize. */
  init(c: SceneCtx): void;
  /**
   * @param t      seconds since the scene became active
   * @param intro  0..1 entrance progress, for the transition between scenes
   */
  frame(c: SceneCtx, t: number, intro: number): void;
}

/** Mulberry32 — small, fast, and seedable so posters are reproducible. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One radial-gradient dab, rendered once. Every glowing point in every scene is
 * this image scaled and tinted by globalAlpha under `lighter`.
 */
function makeDab(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  // Kept in sync with CYAN/GLOW in prims.ts by hand — this runs before any
  // stylesheet is parsed, so it cannot read the custom properties.
  grad.addColorStop(0, 'rgba(153,255,255,1)');
  grad.addColorStop(0.25, 'rgba(0,216,231,0.55)');
  grad.addColorStop(1, 'rgba(0,216,231,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

/**
 * One time origin for the whole session, set on first use and never reset.
 *
 * This is what makes the field continue across a route change. Astro's view
 * transitions keep the document alive, so a scene mounted on the next page
 * picks up the clock where the last one left off instead of restarting at
 * zero — which is the single most mechanical thing a site can do.
 */
let ORIGIN = 0;

/**
 * A per-visit offset into the drift, so no two visits show the same motion.
 * It is deliberately NOT part of the seed: `init` stays deterministic, the
 * composition is identical every time, and only the motion differs. It is also
 * only ever applied to the animated clock — `renderOnce` is always called at
 * the true zero, so posters and reduced-motion stills are reproducible.
 */
let VISIT_PHASE = 0;

export function beginSession(reduced: boolean): void {
  if (!ORIGIN) ORIGIN = performance.now();
  if (!reduced && !VISIT_PHASE) VISIT_PHASE = Math.random() * 900;
}

/** Ambient fields do not need 60fps, and halving the rate halves the power. */
const FPS_CAP = 30;
const MIN_FRAME_MS = 1000 / FPS_CAP - 1;

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  scene: Scene;
  seed: number;
  /** When true the scene renders exactly one frame at t=0 and never animates. */
  still: boolean;
  /** Frames per second. Defaults to FPS_CAP; the background runs slower. */
  fps?: number;
}

export class Engine {
  private c: SceneCtx;
  private scene: Scene;
  private raf = 0;
  private running = false;
  private still: boolean;
  private canvas: HTMLCanvasElement;
  private io?: IntersectionObserver;
  private visible = true;
  private seed: number;
  private lastFrame = 0;
  private minFrameMs = MIN_FRAME_MS;
  private rect: DOMRect | null = null;
  /**
   * Set by the governor in mount.ts. While true this engine will not run no
   * matter what its own observer sees — otherwise a field the governor has
   * deliberately stopped would restart itself the moment it scrolled into view,
   * and "one moving thing per viewport" would quietly stop being true.
   */
  private suspended = false;
  /** Entrance progress, ramped by mountFields as the scene draws itself in. */
  intro = 1;

  constructor(o: EngineOptions) {
    this.canvas = o.canvas;
    this.scene = o.scene;
    this.still = o.still;
    this.minFrameMs = o.fps ? 1000 / o.fps - 1 : MIN_FRAME_MS;
    const ctx = o.canvas.getContext('2d', { alpha: true })!;
    this.seed = o.seed;
    this.c = {
      ctx, w: 0, h: 0, rng: seeded(o.seed), dab: makeDab(64),
      px: -1, py: -1, pstr: 0, idle: 0,
      // Derived from the seed so it is stable per scene but different between
      // scenes: two fields on one page must not breathe together.
      phase: (o.seed % 997) / 997 * 6.283,
    };
    this.resize();

    // Offscreen scenes must not burn frames. Cheap, and it matters on a page
    // that holds four of them.
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(
        (es) => {
          this.visible = es[0].isIntersecting;
          if (!this.visible) this.pause();
          else if (this.running && !this.suspended) this.startLoop();
        },
        { threshold: 0 }
      );
      this.io.observe(o.canvas);
    }
  }

  resize(): void {
    // Reseed before re-initialising. `init` draws from `rng`, so without this
    // the second call continues the sequence where the first one stopped and
    // the scene composes differently — every resize would silently produce a
    // different arrangement, and the poster, captured at the initial state,
    // would never match the canvas again.
    this.c.rng = seeded(this.seed);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.c.w = w;
    this.c.h = h;
    this.rect = r;
    this.scene.init(this.c);
    if (this.still || !this.running) this.renderOnce(0);
  }

  /**
   * A single deterministic frame — the poster, and the reduced-motion state.
   * Always at the true zero with no visit phase and no viewer input, so it is
   * byte-identical on every machine and every visit.
   */
  renderOnce(t = 0): void {
    this.c.px = -1; this.c.py = -1; this.c.pstr = 0; this.c.idle = 0;
    this.c.ctx.clearRect(0, 0, this.c.w, this.c.h);
    this.scene.frame(this.c, t, 1);
  }

  /** Cheap enough to call on scroll; never called inside the frame loop. */
  refreshRect(): void {
    this.rect = this.canvas.getBoundingClientRect();
  }

  /** Stop, and stay stopped until play() is called. The governor's off switch. */
  hold(): void {
    this.suspended = true;
    this.pause();
  }

  play(): void {
    this.suspended = false;
    if (this.still || this.running) {
      // Already running, or a still — but if a hold cancelled the frame loop
      // while running stayed true, it has to be restarted here.
      if (this.running && this.visible) this.startLoop();
      return;
    }
    this.running = true;
    if (this.visible) this.startLoop();
  }

  pause(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  stop(): void {
    this.running = false;
    this.pause();
    this.io?.disconnect();
  }

  /**
   * Start the frame loop, at most once.
   *
   * The guard is the whole point. `tick` schedules its own successor, so every
   * extra call to it starts a second independent chain that pause() cannot
   * cancel — it only ever holds the newest id. Both the observer and play()
   * can fire more than once, and without this the chains accumulated: eight of
   * them on a four-scene page, which is how "one moving thing per viewport"
   * turned into every scene running at once and 480 frame callbacks a second.
   */
  private startLoop(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now();

    // Frame cap. Ambient drift does not need 60fps and the cap roughly halves
    // the idle cost; the RAF chain still runs so the browser can throttle it.
    if (now - this.lastFrame < this.minFrameMs) return;
    const dt = this.lastFrame ? (now - this.lastFrame) / 1000 : 0;
    this.lastFrame = now;

    decayViewer(now, dt);

    // The pointer, translated into this canvas's own space. Recomputing the
    // rect every frame would be a layout read per frame per canvas, so it is
    // refreshed on resize and scroll instead.
    if (viewer.strength > 0.002 && viewer.x >= 0 && this.rect) {
      this.c.px = viewer.x - this.rect.left;
      this.c.py = viewer.y - this.rect.top;
      this.c.pstr = viewer.strength;
    } else {
      this.c.px = -1;
      this.c.py = -1;
      this.c.pstr = 0;
    }
    // On touch there is no pointer, so scroll velocity is the equivalent input.
    if (this.c.pstr === 0 && viewer.scroll > 0.01) this.c.pstr = viewer.scroll * 0.6;
    this.c.idle = viewer.idle;

    // One clock for the session, so a route change does not restart the field.
    const t = (now - ORIGIN) / 1000 + VISIT_PHASE;
    this.c.ctx.clearRect(0, 0, this.c.w, this.c.h);
    this.scene.frame(this.c, t, this.intro);
  };
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
