/**
 * PorchLight website — the MLS surface and the lead generation and nurture
 * systems.
 *
 * A wide scattered field drawn inward to a single locus. The outer field has to
 * stay visible or the scene reads as a blob rather than as convergence — so
 * particles carry a floor of brightness at the rim and gain, not appear, as
 * they arrive.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameShape, CYAN, GLOW } from '../field/prims';

interface P { a: number; r0: number; r: number; sp: number; sz: number; drift: number }

let ps: P[] = [];
let cx = 0, cy = 0, R = 0;
let ring: Array<[number, number]> = [];

export const converge: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.44;
    R = Math.min(c.w * 0.46, c.h * 0.60, 470);
    const n = Math.round(Math.min(2200, Math.max(900, (c.w * c.h) / 620)));
    ps = [];
    for (let i = 0; i < n; i++) {
      ps.push({
        a: c.rng() * Math.PI * 2,
        // Bias toward the rim so the field reads wide rather than clustered.
        r0: 0.42 + Math.sqrt(c.rng()) * 0.58,
        r: c.rng(),
        sp: 0.045 + c.rng() * 0.065,
        sz: 1.7 + c.rng() * 2.8,
        drift: (c.rng() - 0.5) * 0.18,
      });
    }
    // Everything converges onto the mark itself.
    ring = flameShape(cx, cy, R * 0.62).filter((_, i) => i % 3 === 0);
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, cx, cy, R * 1.2, e);
    halftone(c, cx, cy, R * 1.25, 23, 0.045 * e);

    ctx.globalCompositeOperation = 'lighter';
    for (const p of ps) {
      let r = p.r - t * p.sp;
      r = ((r % 1) + 1) % 1;
      const ang = p.a + p.drift * t + (1 - r) * 0.6;
      const rad = R * p.r0 * r;
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad * 0.80;
      const near = 1 - r;
      // Floor of 0.16 so the rim is present; gain toward the middle; fade only
      // in the last few percent so nothing pops out of existence.
      const a = (0.16 + near * near * 0.46) * (r > 0.05 ? 1 : r / 0.05) * e;
      dab(c, x, y, p.sz * (1 + near * 1.5), a);
    }

    dab(c, cx, cy, R * 0.40, 0.14 * e);

    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${CYAN}, ${0.62 * e})`;
    for (const [x, y] of ring) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${GLOW}, ${0.5 * e})`;
    for (let i = 0; i < ring.length; i += 4) {
      ctx.beginPath();
      ctx.arc(ring[i][0], ring[i][1], 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
