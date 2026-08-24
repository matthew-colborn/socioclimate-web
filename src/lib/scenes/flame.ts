/**
 * Scene 00 — what SocioClimate does. The front door.
 *
 * The mark itself, drawn from the traced contour rather than shown as an image.
 * Every other scene in the rotation is a transformation of these same points,
 * so the loop returning here reads as the thing reassembling rather than as a
 * carousel wrapping around.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameShape, resample, CYAN, GLOW } from '../field/prims';

interface Spark { i: number; t0: number; sp: number; drift: number }

let pts: Array<[number, number]> = [];
let sparks: Spark[] = [];
let cx = 0, cy = 0, H = 0;

export const flame: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.44;
    H = Math.min(c.h * 0.58, c.w * 0.42, 460);
    pts = flameShape(cx, cy, H);
    sparks = [];
    const anchors = resample(pts, 42);
    for (let i = 0; i < anchors.length; i++) {
      sparks.push({
        i: Math.floor((i * pts.length) / anchors.length),
        t0: c.rng() * 6,
        sp: 0.25 + c.rng() * 0.35,
        drift: (c.rng() - 0.5) * 22,
      });
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, cx, cy, H * 0.85, e);
    halftone(c, cx, cy, H * 0.9, 23, 0.05 * e);

    // The contour breathes as a whole rather than each point wandering, so the
    // silhouette stays legible as the mark.
    const breathe = 1 + Math.sin(t * 0.42) * 0.018;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${CYAN}, ${0.34 * e})`;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = cx + (pts[i][0] - cx) * breathe;
      const y = cy + (pts[i][1] - cy) * breathe;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';

    // A travelling brightness around the contour, so the outline is alive
    // without any point leaving its place.
    const head = (t * 0.11) % 1;
    for (let i = 0; i < pts.length; i += 2) {
      const u = i / pts.length;
      let d = Math.abs(u - head);
      if (d > 0.5) d = 1 - d;
      const k = Math.max(0, 1 - d / 0.16);
      const x = cx + (pts[i][0] - cx) * breathe;
      const y = cy + (pts[i][1] - cy) * breathe;
      dab(c, x, y, 5 + k * 12, (0.14 + k * 0.5) * e);
    }

    // Sparks lift off the contour and fade, the one thing that leaves the mark.
    for (const s of sparks) {
      const life = ((t + s.t0) * s.sp) % 1;
      const p = pts[s.i];
      const y = p[1] - life * H * 0.34;
      const x = p[0] + s.drift * life;
      dab(c, x, y, 4 + (1 - life) * 3, (1 - life) * (1 - life) * 0.5 * e);
    }

    dab(c, cx, cy + H * 0.18, H * 0.42, 0.13 * e);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${GLOW}, ${0.55 * e})`;
    for (let i = 0; i < pts.length; i += 9) {
      const x = cx + (pts[i][0] - cx) * breathe;
      const y = cy + (pts[i][1] - cy) * breathe;
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
