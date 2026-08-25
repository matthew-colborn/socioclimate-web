/**
 * The site background: one endless stream of swell behind the whole page.
 *
 * Not sections of wave. A single field that the page moves through — crests
 * arrive from below and pass up out of view as you scroll, and there is no
 * bottom to it, because the crests are generated rather than stored.
 *
 * Coupled to scroll position, not triggered by it. Every crest has an integer
 * index and a world position; the field's offset is a function of scrollY, so
 * scrolling back up passes back through the same crests rather than replaying
 * an animation. Each crest's shape comes from a hash of its index, so it is
 * both endless and stable: crest 47 looks the same every time you pass it, and
 * no two crests are alike.
 *
 * PARALLAX keeps the field slower than the page, which is the difference
 * between depth and a background glued to the scrollbar.
 *
 * Character from brand/logo-horizontal.jpeg: solid forms with a bright crest
 * edge and a filled body, not hairlines. Slow — the scroll coupling adds
 * travel, not speed.
 *
 * It is ground, not subject. Peak alpha stays low enough that text over it
 * clears AA at the stream's brightest, which scripts/scene-check.mjs measures
 * against real composited pixels at several scroll offsets and fails on.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { flameProfile, CYAN, GLOW } from '../field/prims';
import { drift, breath, viewer } from '../field/life';

/** World distance between crests. */
const SPACING = 300;
/** The field travels at a third of the page: parallax, not glue. */
const PARALLAX = 0.34;
/** World px per second of self-motion, so it lives while you stand still. */
const DRIFT = 7;
/** Samples along a crest. */
const STEPS = 72;

const PULL_LIFT = 26;
const PULL_REACH = 0.26;

interface Crest { f1: number; f2: number; p1: number; p2: number; w: number; amp: number }

/** Deterministic per-index parameters, computed once and kept. */
const shapes = new Map<number, Crest>();

/** Integer hash. Deterministic, so a crest is identical every time you pass it. */
function hash(n: number, k: number): number {
  let x = Math.imul(n ^ Math.imul(k, 0x9e3779b9), 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

function shapeFor(n: number): Crest {
  let s = shapes.get(n);
  if (s) return s;
  s = {
    f1: 2.2 + hash(n, 1) * 2.4,
    f2: 4.5 + hash(n, 2) * 3.5,
    p1: hash(n, 3) * 6.283,
    p2: hash(n, 4) * 6.283,
    w: 0.45 + hash(n, 5) * 0.4,
    amp: 0.72 + hash(n, 6) * 0.56,
  };
  // The map is bounded in practice — only crests actually visited are stored —
  // but a very long session on a very long page should not grow it forever.
  if (shapes.size > 512) shapes.clear();
  shapes.set(n, s);
  return s;
}

let prof: number[] = [];
let W = 0, H = 0;

/**
 * Damped following.
 *
 * The field used to take viewer.scrollY straight, and a wheel delivers scroll
 * in 100-120px jumps, so the field inherited every step. Now the scroll handler
 * only records where the page is and this eases toward it each frame: the
 * stream chases your scroll rather than being welded to it, which is also what
 * absorbs the difference between a coarse wheel and a smooth trackpad.
 *
 * Exponential, not a fixed lerp factor — 1 - e^(-k dt) is frame-rate
 * independent, so the damping feels identical at 15fps and at 60. Critically
 * damped by construction: it approaches and never overshoots, so there is no
 * wobble to tune out.
 *
 * The glide to rest is the same curve. When scrolling stops the target stops
 * moving and the field coasts the last few pixels in, then the idle drift term
 * carries on underneath with no seam, because it was never switched off.
 */
const FOLLOW = 7.5;
/** Below this the field has arrived and the frame cap goes back on. */
const SETTLED = 0.4;

let smooth = 0;
let started = false;
let lastT = -1;
let chasing = false;

export const waves: Scene = {
  init(c: SceneCtx) {
    W = c.w;
    H = c.h;

    const raw = flameProfile(STEPS);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const norm = raw.map((v) => Math.pow((v - lo) / ((hi - lo) || 1), 1.2));
    const pass = (a: number[]): number[] =>
      a.map((_, i) => (a[Math.max(0, i - 1)] + a[i] * 2 + a[Math.min(a.length - 1, i + 1)]) / 4);
    prof = pass(pass(norm));
  },

  wantsFullRate(): boolean {
    return chasing;
  },

  frame(c: SceneCtx, t: number) {
    const { ctx } = c;

    const dt = lastT < 0 ? 0 : Math.min(0.1, t - lastT);
    lastT = t;

    const target = viewer.scrollY;
    if (!started) { smooth = target; started = true; }
    smooth += (target - smooth) * (1 - Math.exp(-FOLLOW * dt));
    chasing = Math.abs(target - smooth) > SETTLED;

    const br = breath(t, 11, 1.9);
    const horizon = H * 0.16;

    ctx.globalCompositeOperation = 'lighter';

    // ---- atmosphere ------------------------------------------------------
    const gx = W * (0.5 + drift(t, 0.012, 2.2) * 0.06);
    const gy = H * (0.56 + drift(t, 0.01, 5.1) * 0.05);
    const gr = Math.max(W, H) * (0.78 + br * 0.1);
    const wash = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    wash.addColorStop(0, `rgba(30, 111, 168, ${0.23 + br * 0.04})`);
    wash.addColorStop(0.42, 'rgba(22, 78, 126, 0.11)');
    wash.addColorStop(1, 'rgba(6, 32, 56, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);

    // The far distance the stream recedes to.
    const hor = ctx.createLinearGradient(0, 0, W, 0);
    hor.addColorStop(0, `rgba(${CYAN}, 0)`);
    hor.addColorStop(0.5, `rgba(${GLOW}, ${0.05 + br * 0.02})`);
    hor.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.fillStyle = hor;
    ctx.fillRect(0, horizon - 1, W, 2);

    // ---- the stream ------------------------------------------------------
    // One offset drives everything. Scroll moves it; time moves it a little
    // more, so the stream still travels when nobody is scrolling.
    const offset = smooth * PARALLAX + t * DRIFT;

    // Which crests land on screen. Only these are drawn — the rest of the
    // stream costs nothing because it is never computed.
    const first = Math.floor((offset + horizon - H * 0.35) / SPACING);
    const last = Math.ceil((offset + H + H * 0.2) / SPACING);

    for (let n = first; n <= last; n++) {
      const y0 = n * SPACING - offset;
      if (y0 < horizon - H * 0.4 || y0 > H * 1.3) continue;

      // Depth from screen position, not from index: a crest recedes as it
      // travels up, so the stream reads as distance rather than as a list.
      const v = Math.max(0, Math.min(1, (y0 - horizon) / (H - horizon)));
      const s = shapeFor(n);

      const amp = H * (0.055 + v * 0.085) * s.amp * (0.85 + br * 0.3);
      const squeeze = 0.72 + v * 0.36;
      const alpha = (0.012 + v * 0.042) * (0.85 + br * 0.3);
      if (alpha <= 0.002) continue;

      const crest: number[] = [];
      for (let i = 0; i < STEPS; i++) {
        const u = i / (STEPS - 1);
        const x = W * 0.5 + (u - 0.5) * W * 1.1 * squeeze;

        // Slow travelling components plus the mark's silhouette as envelope.
        const swell =
          Math.sin(u * s.f1 + s.p1 - t * 0.07) * s.w +
          Math.sin(u * s.f2 + s.p2 + t * 0.045) * (1 - s.w) * 0.5 +
          drift(t, 0.03, n * 1.7) * 0.16;

        let y = y0 - (0.4 + 0.6 * prof[i]) * amp * (0.55 + swell);

        // Deforms toward the pointer and settles back. Zero under
        // prefers-reduced-motion, because c.pstr is forced to zero there.
        if (c.pstr > 0.002 && c.px >= 0) {
          const dx = Math.abs(x - c.px) / (W * PULL_REACH);
          if (dx < 1) {
            const g = (1 - dx) * (1 - dx);
            const near = 1 - Math.min(1, Math.abs(y - c.py) / (H * 0.45));
            y -= g * PULL_LIFT * c.pstr * (0.4 + 0.6 * near) * (0.35 + 0.65 * v);
          }
        }
        crest.push(x, y);
      }

      // The body, filled downward — the volume the lockup's ridge has.
      const foot = y0 + SPACING * 0.85;
      let top = Infinity;
      for (let i = 1; i < crest.length; i += 2) if (crest[i] < top) top = crest[i];
      const fill = ctx.createLinearGradient(0, top, 0, foot);
      fill.addColorStop(0, `rgba(${CYAN}, ${alpha})`);
      fill.addColorStop(0.6, `rgba(${CYAN}, ${alpha * 0.3})`);
      fill.addColorStop(1, `rgba(${CYAN}, 0)`);

      ctx.globalAlpha = 1;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(crest[0], crest[1]);
      for (let i = 2; i < crest.length; i += 2) ctx.lineTo(crest[i], crest[i + 1]);
      ctx.lineTo(W + 40, foot);
      ctx.lineTo(-40, foot);
      ctx.closePath();
      ctx.fill();

      // The bright edge that gives the form its definition.
      ctx.strokeStyle = `rgba(${GLOW}, ${(0.018 + v * 0.062) * (0.85 + br * 0.3)})`;
      ctx.lineWidth = 0.8 + v * 0.7;
      ctx.beginPath();
      ctx.moveTo(crest[0], crest[1]);
      for (let i = 2; i < crest.length; i += 2) ctx.lineTo(crest[i], crest[i + 1]);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
