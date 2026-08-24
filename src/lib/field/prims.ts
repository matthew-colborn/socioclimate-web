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

/** Additive glow point. `s` is diameter in CSS px, `a` is 0..1. */
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
 * Points sampled along the traced flame contour, normalised to 0..1 in both
 * axes. This is what keeps the generative work tied to the mark rather than
 * being arbitrary particle art.
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
