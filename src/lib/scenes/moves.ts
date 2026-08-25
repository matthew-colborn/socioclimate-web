/**
 * The four scenes on /what-we-do — one per move.
 *
 * A note on what these are attached to. The brief named the four service lines
 * (operating systems, websites and lead systems, marketing, strategy and
 * capital), but those live on the home page; /what-we-do carries the four
 * moves. Since no word of the content was to change, the scenes are bound to
 * the four moves that are actually on that page.
 *
 * One system, four readings, exactly like the portfolio scenes: every one of
 * these is the same traced flame contour under a different operation. Nothing
 * here invents a new shape.
 *
 *   find       a scan sweeps the contour and a few points stay lit
 *   capture    points fall out of the upper contour into its own lower basin
 *   understand scattered points settle onto the flame's histogram
 *   revenue    points leave the contour along one aimed line
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameShape, flameProfile, resample, CYAN, TEAL } from '../field/prims';

/* ------------------------------------------------------------------ find -- */
/* Most of the record is there and unlit. A scan crosses it, and the few points
   that matter stay bright after the scan has passed — which is the move. */
let f_pts: Array<[number, number]> = [];
let f_keep: boolean[] = [];
let f_cx = 0, f_cy = 0, f_H = 0;

export const find: Scene = {
  init(c) {
    f_cx = c.w / 2;
    f_cy = c.h * 0.48;
    f_H = Math.min(c.h * 0.66, c.w * 0.72, 340);
    f_pts = resample(flameShape(f_cx, f_cy, f_H), 150);
    f_keep = f_pts.map(() => c.rng() < 0.16);
  },
  frame(c: SceneCtx, t, intro) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, f_cx, f_cy, f_H * 0.8, e * 0.7);
    halftone(c, f_cx, f_cy, f_H * 0.9, 24, 0.04 * e);
    ctx.globalCompositeOperation = 'lighter';

    // The contour, so the thing being searched is legible as the mark. Without
    // it the scene is a cloud of dots and a line, which says nothing.
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${TEAL}, ${0.5 * e})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < f_pts.length; i++) {
      const [x, y] = f_pts[i];
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    const left = f_cx - f_H * 0.42;
    const wide = f_H * 0.84;
    const scan = left + ((t * 0.20) % 1.4 - 0.2) * wide;

    for (let i = 0; i < f_pts.length; i++) {
      const [x, y] = f_pts[i];
      const near = Math.max(0, 1 - Math.abs(x - scan) / (f_H * 0.12));
      const lit = f_keep[i] ? 0.46 : 0.16;
      dab(c, x, y, f_keep[i] ? 5 : 3.2, (lit + near * 0.5) * e);
      if (f_keep[i]) dab(c, x, y, 11 + near * 6, (0.16 + near * 0.3) * e);
    }

    // A soft band rather than a hard rule: this is a search, not a cursor.
    const bg = ctx.createLinearGradient(scan - f_H * 0.1, 0, scan + f_H * 0.1, 0);
    bg.addColorStop(0, `rgba(${CYAN}, 0)`);
    bg.addColorStop(0.5, `rgba(${CYAN}, ${0.1 * e})`);
    bg.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.fillRect(scan - f_H * 0.1, f_cy - f_H * 0.55, f_H * 0.2, f_H * 1.1);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};

/* --------------------------------------------------------------- capture -- */
/* The record falls out of the work and collects. The basin it lands in is the
   flame's own lower contour, so the collector is not a new shape either. */
interface Drop { i: number; t0: number; sp: number }
let c_pts: Array<[number, number]> = [];
let c_drops: Drop[] = [];
let c_cx = 0, c_cy = 0, c_H = 0, c_floor = 0;

export const capture: Scene = {
  init(c) {
    c_cx = c.w / 2;
    c_cy = c.h * 0.44;
    c_H = Math.min(c.h * 0.64, c.w * 0.70, 330);
    c_pts = resample(flameShape(c_cx, c_cy, c_H), 120);
    c_floor = c_cy + c_H * 0.46;
    c_drops = [];
    for (let i = 0; i < 46; i++) {
      c_drops.push({ i: Math.floor(c.rng() * c_pts.length), t0: c.rng() * 5, sp: 0.3 + c.rng() * 0.3 });
    }
  },
  frame(c: SceneCtx, t, intro) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, c_cx, c_floor - c_H * 0.1, c_H * 0.7, e * 0.7);
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${TEAL}, ${0.5 * e})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < c_pts.length; i++) {
      const [x, y] = c_pts[i];
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    for (const d of c_drops) {
      const life = ((t + d.t0) * d.sp) % 1;
      const [sx, sy] = c_pts[d.i];
      // Accelerating fall, then it settles onto the floor and fades.
      const k = life * life;
      const y = sy + (c_floor - sy) * k;
      const x = sx + (c_cx - sx) * k * 0.55;
      dab(c, x, y, 3.4, (1 - life * 0.6) * 0.5 * e);
    }

    // What has collected. A hairline with the light pooling under it, rather
    // than a filled rectangle — the rectangle read as a UI element sitting in
    // the scene rather than as something the scene had produced.
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(c_cx - c_H * 0.4, 0, c_cx + c_H * 0.4, 0);
    g.addColorStop(0, `rgba(${CYAN}, 0)`);
    g.addColorStop(0.5, `rgba(${CYAN}, ${0.55 * e})`);
    g.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c_cx - c_H * 0.4, c_floor);
    ctx.lineTo(c_cx + c_H * 0.4, c_floor);
    ctx.stroke();
    dab(c, c_cx, c_floor + c_H * 0.02, c_H * 0.56, 0.13 * e);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};

/* ------------------------------------------------------------ understand -- */
/* The same points, twice: scattered where they cannot be read, and settled onto
   the flame's own histogram where they can. The move is the settling. */
const U_N = 108;
let u_prof: number[] = [];
let u_jx: number[] = [];
let u_jy: number[] = [];
let u_cx = 0, u_cy = 0, u_span = 0, u_base = 0, u_h = 0;

export const understand: Scene = {
  init(c) {
    u_cx = c.w / 2;
    u_cy = c.h * 0.5;
    u_span = Math.min(c.w * 0.8, c.h * 1.1, 400);
    u_h = u_span * 0.44;
    u_base = u_cy + u_h * 0.5;
    const raw = flameProfile(U_N);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    u_prof = raw.map((v) => Math.pow((v - lo) / ((hi - lo) || 1), 1.35));
    u_jx = []; u_jy = [];
    for (let i = 0; i < U_N; i++) { u_jx.push((c.rng() - 0.5) * 2); u_jy.push((c.rng() - 0.5) * 2); }
  },
  frame(c: SceneCtx, t, intro) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, u_cx, u_cy, u_span * 0.55, e * 0.7);
    halftone(c, u_cx, u_cy, u_span * 0.6, 24, 0.04 * e);
    ctx.globalCompositeOperation = 'lighter';

    // Settled 0..1, and it never sits at either end for long.
    const s = 0.5 + 0.5 * Math.sin(t * 0.36 + Math.sin(t * 0.191) * 0.7);
    const settled = s * s * (3 - 2 * s);

    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${CYAN}, ${0.2 * settled * e})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < U_N; i++) {
      const u = i / (U_N - 1);
      const xs = u_cx - u_span / 2 + u * u_span;
      const ys = u_base - u_prof[i] * u_h;
      const xn = xs + u_jx[i] * u_span * 0.16 + Math.sin(t * 0.9 + i) * 4;
      const yn = u_cy + u_jy[i] * u_h * 0.7;
      const x = xn + (xs - xn) * settled;
      const y = yn + (ys - yn) * settled;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      dab(c, x, y, 3.2, (0.14 + 0.34 * settled) * e);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};

/* ---------------------------------------------------------------- revenue -- */
/* Everything the other three moves produced, aimed. One line leaves the
   contour and the points accelerate along it rather than drifting. */
interface Shot { t0: number; sp: number; off: number }
let r_pts: Array<[number, number]> = [];
let r_shots: Shot[] = [];
let r_cx = 0, r_cy = 0, r_H = 0, r_x1 = 0, r_y1 = 0;

export const revenue: Scene = {
  init(c) {
    r_cx = c.w * 0.42;
    r_cy = c.h * 0.5;
    r_H = Math.min(c.h * 0.6, c.w * 0.62, 300);
    r_pts = resample(flameShape(r_cx, r_cy, r_H), 100);
    r_x1 = c.w * 0.94;
    r_y1 = c.h * 0.36;
    r_shots = [];
    for (let i = 0; i < 30; i++) r_shots.push({ t0: c.rng() * 4, sp: 0.35 + c.rng() * 0.3, off: (c.rng() - 0.5) * r_H * 0.12 });
  },
  frame(c: SceneCtx, t, intro) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, r_cx, r_cy, r_H * 0.8, e * 0.7);
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${TEAL}, ${0.45 * e})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < r_pts.length; i++) {
      const [x, y] = r_pts[i];
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    const sx = r_cx + r_H * 0.18;
    const sy = r_cy;
    ctx.strokeStyle = `rgba(${CYAN}, ${0.16 * e})`;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(r_x1, r_y1);
    ctx.stroke();

    for (const s of r_shots) {
      const life = ((t + s.t0) * s.sp) % 1;
      // Accelerating: this is aimed, not drifting.
      const k = life * life;
      const x = sx + (r_x1 - sx) * k;
      const y = sy + (r_y1 - sy) * k + s.off * (1 - k);
      dab(c, x, y, 3 + k * 3, (1 - k) * 0.6 * e);
    }

    dab(c, r_x1, r_y1, r_H * 0.3, 0.12 * e);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
