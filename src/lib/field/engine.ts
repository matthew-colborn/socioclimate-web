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

export interface SceneCtx {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels, not device pixels — the transform already accounts for DPR. */
  w: number;
  h: number;
  /** Deterministic per scene, so a poster frame matches the first animated frame. */
  rng: () => number;
  dab: HTMLCanvasElement;
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
  grad.addColorStop(0, 'rgba(143,237,227,1)');
  grad.addColorStop(0.25, 'rgba(63,191,181,0.55)');
  grad.addColorStop(1, 'rgba(63,191,181,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  scene: Scene;
  seed: number;
  /** When true the scene renders exactly one frame at t=0 and never animates. */
  still: boolean;
}

export class Engine {
  private c: SceneCtx;
  private scene: Scene;
  private raf = 0;
  private start = 0;
  private running = false;
  private still: boolean;
  private canvas: HTMLCanvasElement;
  private io?: IntersectionObserver;
  private visible = true;
  private seed: number;
  /** Entrance progress, ramped by mountFields as the scene draws itself in. */
  intro = 1;

  constructor(o: EngineOptions) {
    this.canvas = o.canvas;
    this.scene = o.scene;
    this.still = o.still;
    const ctx = o.canvas.getContext('2d', { alpha: true })!;
    this.seed = o.seed;
    this.c = { ctx, w: 0, h: 0, rng: seeded(o.seed), dab: makeDab(64) };
    this.resize();

    // Offscreen scenes must not burn frames. Cheap, and it matters on a page
    // that holds four of them.
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(
        (es) => {
          this.visible = es[0].isIntersecting;
          if (!this.visible) this.pause();
          else if (this.running) this.loop();
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
    this.scene.init(this.c);
    if (this.still || !this.running) this.renderOnce(0);
  }

  /** Draw a single deterministic frame — the poster, and the reduced-motion state. */
  renderOnce(t = 0): void {
    this.c.ctx.clearRect(0, 0, this.c.w, this.c.h);
    this.scene.frame(this.c, t, 1);
  }

  play(): void {
    if (this.still || this.running) return;
    this.running = true;
    this.start = performance.now();
    if (this.visible) this.loop();
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

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop);
    const t = (performance.now() - this.start) / 1000;
    this.c.ctx.clearRect(0, 0, this.c.w, this.c.h);
    this.scene.frame(this.c, t, this.intro);
  };
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
