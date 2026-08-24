/**
 * Drawing primitives shared by every scene. Three motifs and nothing else:
 * the glow dab, the halftone dot field, and the hairline orthogonal annotation
 * with a terminal dot — the last two lifted from brand/references/ref-3.
 */
import type { SceneCtx } from './engine';
import { FLAME_PATH } from '../flame';

export const CYAN = '0, 216, 231';
export const GLOW = '153, 255, 255';
export const TEAL = '0, 97, 132';

/**
 * Additive glow point. `s` is diameter in CSS px, `a` is 0..1.
 *
 * NOTE: this leaves ctx.globalAlpha set to `a`. Reset it before stroking or
 * filling anything afterwards, or that draw is multiplied down by whatever
 * the last particle happened to use.
 */
export function dab(c: SceneCtx, x: number, y: number, s: number, a: number): void {
  if (a <= 0.002 || s <= 0.2) return;
  c.ctx.globalAlpha = a > 1 ? 1 : a;
  c.ctx.drawImage(c.dab, x - s / 2, y - s / 2, s, s);
}

/** A soft radial wash behind the focal object — the Obelisk halo. */
export function halo(c: SceneCtx, x: number, y: number, r: number, a: number): void {
  const g = c.ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${CYAN}, ${0.16 * a})`);
  g.addColorStop(0.45, `rgba(${CYAN}, ${0.05 * a})`);
  g.addColorStop(1, `rgba(${CYAN}, 0)`);
  c.ctx.globalAlpha = 1;
  c.ctx.fillStyle = g;
  c.ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/**
 * Halftone dots — a sparse regular grid whose radius falls off with distance
 * from a focus. Ref 3's texture, at a density that reads as material rather
 * than pattern.
 */
export function halftone(
  c: SceneCtx, cx: number, cy: number, reach: number, step: number, a: number
): void {
  const { ctx } = c;
  ctx.globalAlpha = 1;
  ctx.fillStyle = `rgba(${CYAN}, ${a})`;
  for (let y = (c.h % step) / 2; y < c.h; y += step) {
    for (let x = (c.w % step) / 2; x < c.w; x += step) {
      const d = Math.hypot(x - cx, y - cy) / reach;
      if (d > 1) continue;
      const r = (1 - d) * (1 - d) * (step * 0.16);
      if (r < 0.15) continue;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Hairline annotation: a horizontal run, one right-angle bend, a short run, and
 * a terminal dot. The technical-drawing marks from ref 3, used to point at the
 * focal object without labelling it — the labels are real DOM text.
 */
export function annotate(
  c: SceneCtx, x: number, y: number, run: number, drop: number, a: number
): void {
  const { ctx } = c;
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `rgba(${CYAN}, ${a})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + run, y);
  ctx.lineTo(x + run, y + drop);
  ctx.stroke();
  ctx.fillStyle = `rgba(${GLOW}, ${a * 1.4})`;
  ctx.beginPath();
  ctx.arc(x + run, y + drop, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Smoothstep, for entrances that do not start or stop abruptly. */
export const ease = (t: number): number => {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * (3 - 2 * x);
};

/** Cheap value noise. Enough shape for a ridge; not worth a simplex import. */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const h = (n: number) => {
    let v = Math.imul(n ^ seed, 0x27d4eb2d);
    v ^= v >>> 15;
    return ((v >>> 0) % 10000) / 10000;
  };
  const a = h(i), b = h(i + 1);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}

/**
 * The flame contour, sampled from the traced path and normalised to 0..1.
 *
 * This is the seed geometry for every scene. Scene 00 draws it as itself;
 * the ridge, the traces, the convergence, the lattice and the opening are all
 * transformations of these same points. That is what makes "derived from the
 * flame mark" a fact about the code rather than a claim in a comment.
 */
let flameCache: Array<[number, number]> | null = null;
export function flamePoints(): Array<[number, number]> {
  if (flameCache) return flameCache;
  const pts: Array<[number, number]> = [];
  const re = /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(FLAME_PATH))) {
    pts.push([parseFloat(m[1]) / 160, parseFloat(m[2]) / 305]);
  }
  flameCache = pts;
  return pts;
}

/** The contour placed in the scene: centred on (cx, cy), `h` tall, aspect kept. */
export function flameShape(
  cx: number, cy: number, h: number
): Array<[number, number]> {
  const w = h * (160 / 305);
  return flamePoints().map(([x, y]) => [cx + (x - 0.5) * w, cy + (y - 0.5) * h]);
}

/** Evenly spaced subset, for scenes that need a handful of anchors not 400. */
export function resample<T>(pts: T[], n: number): T[] {
  if (n >= pts.length) return pts.slice();
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(pts[Math.floor((i * pts.length) / n)]);
  return out;
}

/**
 * The flame's upper silhouette, bucketed into `n` columns — the height of the
 * mark at each horizontal position. This is what turns the flame into a data
 * ridge: same geometry, read as a histogram.
 */
export function flameProfile(n: number): number[] {
  const pts = flamePoints();
  const top = new Array(n).fill(1);
  for (const [x, y] of pts) {
    const i = Math.min(n - 1, Math.max(0, Math.floor(x * n)));
    if (y < top[i]) top[i] = y;
  }
  // Fill columns the contour never reaches by interpolating their neighbours.
  for (let i = 0; i < n; i++) {
    if (top[i] < 1) continue;
    let l = i - 1, r = i + 1;
    while (l >= 0 && top[l] >= 1) l--;
    while (r < n && top[r] >= 1) r++;
    const a = l >= 0 ? top[l] : 1;
    const b = r < n ? top[r] : 1;
    top[i] = (a + b) / 2;
  }
  return top.map((t) => 1 - t);
}
