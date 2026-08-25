/**
 * The four-move process on /what-we-do, as one continuous graphic.
 *
 * One particle system, seeded once and never re-seeded. Every particle holds
 * four target positions and the scene interpolates between them, so the same
 * points are found, gathered, resolved and aimed. That is the argument the
 * section is making — four moves on one thing rather than four services — and
 * it only lands if a visitor can watch a point travel the whole way.
 *
 *   0  find        scattered in the dark, most dim, a few catching light
 *   1  capture     a sweep crosses and points fall into rows behind it
 *   2  understand  the rows resolve into the ridge from the lockup
 *   3  revenue     the ridge collapses onto one aimed vector
 *
 * `state.cur` starts at 2 on purpose. Under prefers-reduced-motion nothing ever
 * drives it, so the single rendered frame — and the poster, which is captured
 * in exactly that mode — shows the resolved ridge, which is the state worth
 * being frozen on. The controller snaps it to 0 when it takes over.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameProfile, CYAN, GLOW, TEAL } from '../field/prims';

/** Driven from the page. `cur` is continuous: 0..3, fractional between states. */
export const state = {
  cur: 2,
  target: 2,
  /** While true the scene advances itself, so the story tells itself. */
  auto: true,
};

const N = 240;
const RIDGE_COLS = 60;
const ROWS = 10;
/** Seconds to cross one whole state boundary. */
const TRAVEL = 1.5;

type P = Float64Array;
let ax: P, ay: P, bx: P, by: P, gx: P, gy: P, dx: P, dy: P;
let bright: Float64Array, stagger: Float64Array, xkey: Float64Array;
let cxm = 0, cym = 0;
let left = 0, span = 0, base = 0, ridgeH = 0;
let focusX = 0, focusY = 0;
let lastT = -1;

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (v: number): number => v * v * (3 - 2 * v);

export const process: Scene = {
  init(c: SceneCtx) {
    cxm = c.w / 2; cym = c.h * 0.5;
    span = Math.min(c.w * 0.82, c.h * 1.5);
    left = cxm - span / 2;
    ridgeH = span * 0.30;
    base = cym + ridgeH * 0.62;
    focusX = c.w * 0.90;
    focusY = c.h * 0.20;
    lastT = -1;

    const raw = flameProfile(RIDGE_COLS);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const norm = raw.map((v) => Math.pow((v - lo) / ((hi - lo) || 1), 1.35));
    // A three-tap smoothing pass. The home scene draws this profile as bars,
    // where its column-to-column noise reads as texture; drawn here as a
    // silhouette the same noise reads as a jagged chart rather than terrain.
    // Still the flame's own geometry, just not aliased into spikes.
    const prof = norm.map((_, i) => {
      const a = norm[Math.max(0, i - 1)];
      const b = norm[i];
      const cc = norm[Math.min(RIDGE_COLS - 1, i + 1)];
      return (a + b * 2 + cc) / 4;
    });

    ax = new Float64Array(N); ay = new Float64Array(N);
    bx = new Float64Array(N); by = new Float64Array(N);
    gx = new Float64Array(N); gy = new Float64Array(N);
    dx = new Float64Array(N); dy = new Float64Array(N);
    bright = new Float64Array(N);
    stagger = new Float64Array(N);
    xkey = new Float64Array(N);

    const cols = Math.ceil(N / ROWS);
    const cellW = span / cols;
    const cellH = (ridgeH * 1.5) / ROWS;
    const rowTop = cym - (ridgeH * 1.5) / 2;

    for (let i = 0; i < N; i++) {
      // 0 — scattered. Already present, nothing arriving from outside, so the
      // spread is wide and even rather than radiating from a source.
      const a = c.rng() * Math.PI * 2;
      const r = Math.sqrt(c.rng());
      ax[i] = cxm + Math.cos(a) * r * span * 0.46;
      ay[i] = cym + Math.sin(a) * r * ridgeH * 1.05;
      bright[i] = c.rng() < 0.13 ? 1 : 0;
      stagger[i] = c.rng();

      // 1 — ordered rows.
      const row = i % ROWS;
      const col = Math.floor(i / ROWS);
      bx[i] = left + (col + 0.5) * cellW;
      by[i] = rowTop + (row + 0.5) * cellH;

      // 2 — the ridge. Half the points ride the silhouette, half fill beneath,
      // so the terrain reads as a solid shape rather than a line of dots.
      const rc = i % RIDGE_COLS;
      const layer = Math.floor(i / RIDGE_COLS);
      const layers = Math.ceil(N / RIDGE_COLS);
      const h = prof[rc] * ridgeH;
      gx[i] = left + (rc / (RIDGE_COLS - 1)) * span;
      gy[i] = layer === 0 ? base - h : base - h * (1 - (layer / layers) * 0.85);

      // 3 — aimed. Dense near the focus, and the perpendicular spread closes
      // as it approaches: convergence, not a spray.
      const k = Math.pow(c.rng(), 0.55);
      const sx = cxm;
      const sy = base - ridgeH * 0.45;
      const spread = (c.rng() - 0.5) * ridgeH * 0.5 * (1 - k);
      dx[i] = lerp(sx, focusX, k);
      dy[i] = lerp(sy, focusY, k) + spread;

      xkey[i] = (ax[i] - left) / span;
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);

    // Advance toward the target at a fixed rate, so a jump of two states takes
    // twice as long as a jump of one and nothing ever teleports.
    const dt = lastT < 0 ? 0 : Math.min(0.05, t - lastT);
    lastT = t;
    if (state.auto) {
      // 0 -> 3 -> 0, pausing on each state. The whole story in about 24s.
      const cycle = (t / 6) % 6;
      state.target = cycle < 3 ? Math.floor(cycle) : 3 - Math.floor(cycle - 3);
    }
    const d = state.target - state.cur;
    if (Math.abs(d) < 1e-3) state.cur = state.target;
    else state.cur += Math.sign(d) * Math.min(Math.abs(d), dt / TRAVEL);

    const s = state.cur;
    const i0 = Math.max(0, Math.min(2, Math.floor(s)));
    const f = clamp01(s - i0);
    const A = [ax, bx, gx, dx];
    const B = [ay, by, gy, dy];

    // Weight of each state, for the structural marks that belong to only one.
    const w = [0, 1, 2, 3].map((k) => Math.max(0, 1 - Math.abs(s - k)));

    halo(c, cxm, cym, span * 0.5, e * 0.65);
    halftone(c, cxm, cym, span * 0.55, 24, 0.035 * e);
    ctx.globalCompositeOperation = 'lighter';

    // The capture sweep. It is only real while 0 -> 1 is in progress, and the
    // particles behind it are the ones that have already fallen into rows —
    // the sweep is not dragging them, it is simply where the work has reached.
    const sweeping = i0 === 0 && f > 0.001 && f < 0.999;
    const sweepX = left - span * 0.1 + f * span * 1.2;
    if (sweeping) {
      const g = ctx.createLinearGradient(sweepX - span * 0.09, 0, sweepX + span * 0.02, 0);
      g.addColorStop(0, `rgba(${CYAN}, 0)`);
      g.addColorStop(1, `rgba(${CYAN}, ${0.13 * e})`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(sweepX - span * 0.09, cym - ridgeH * 1.2, span * 0.11, ridgeH * 2.4);
      ctx.strokeStyle = `rgba(${GLOW}, ${0.22 * e})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sweepX, cym - ridgeH * 1.2);
      ctx.lineTo(sweepX, cym + ridgeH * 1.2);
      ctx.stroke();
    }

    // Row rules, while the ordered state is on screen.
    if (w[1] > 0.02) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(${TEAL}, ${0.4 * w[1] * e})`;
      ctx.lineWidth = 1;
      for (let r = 0; r < ROWS; r++) {
        const y = by[r];
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + span, y);
        ctx.stroke();
      }
    }

    // The aim vector, while the directed state is on screen.
    if (w[3] > 0.02) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(${CYAN}, ${0.2 * w[3] * e})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cxm, base - ridgeH * 0.45);
      ctx.lineTo(focusX, focusY);
      ctx.stroke();
      dab(c, focusX, focusY, span * 0.2, 0.16 * w[3] * e);
    }

    const p0x = A[i0], p0y = B[i0];
    const p1x = A[Math.min(3, i0 + 1)], p1y = B[Math.min(3, i0 + 1)];

    for (let i = 0; i < N; i++) {
      // Points do not all move at once. During capture the delay follows the
      // sweep's own position, so a point settles as the sweep reaches it.
      const delay = sweeping ? xkey[i] * 0.72 : stagger[i] * 0.34;
      const k = smooth(clamp01((f - delay) / (1 - delay || 1)));

      const x = lerp(p0x[i], p1x[i], k);
      const y = lerp(p0y[i], p1y[i], k);

      // A few points catch light while scattered; everything is legible once
      // ordered; in the aimed state only what is near the vector stays lit.
      // 0.13 rather than 0.08: dormant has to read as present-but-unlit. At
      // the lower value the dim majority disappeared and the state looked like
      // a handful of points rather than a field that was always there.
      const aScatter = 0.13 + bright[i] * 0.42;
      const aRows = 0.3;
      const aRidge = 0.34;
      const near = 1 - Math.min(1, Math.hypot(x - focusX, y - focusY) / (span * 0.75));
      const aAim = 0.06 + near * 0.5;
      const alpha =
        w[0] * aScatter + w[1] * aRows + w[2] * aRidge + w[3] * aAim;

      const size = 2.6 + (w[0] * bright[i] + w[3] * near) * 2.2;
      dab(c, x, y, size, alpha * e);
    }

    // The ridge silhouette, once the points have resolved into it.
    if (w[2] > 0.02) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(${CYAN}, ${0.34 * w[2] * e})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let rc = 0; rc < RIDGE_COLS; rc++) {
        const x = gx[rc];
        const y = gy[rc];
        if (rc) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
