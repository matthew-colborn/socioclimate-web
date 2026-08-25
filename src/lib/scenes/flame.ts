/**
 * Scene 00 — the home page. The mark, alive.
 *
 * Just the fire. The traced contour breathing, a brightness travelling around
 * it, sparks lifting off — and nothing else.
 *
 * The data ridge that used to sit beneath it has moved: it is the site
 * background now, behind every section rather than under one object. Having it
 * in both places meant the hero was competing with its own backdrop, and the
 * mark reads better as a single burning thing against a moving field than as a
 * burning thing sitting on a smaller copy of that field.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameShape, resample, pull, CYAN, GLOW } from '../field/prims';
import { drift, breath } from '../field/life';

interface Spark { i: number; t0: number; sp: number; drift: number }

let pts: Array<[number, number]> = [];
let sparks: Spark[] = [];
let cx = 0, cy = 0, H = 0;

export const flame: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.46;
    H = Math.min(c.h * 0.74, c.w * 0.80, 460);
    pts = flameShape(cx, cy, H);

    sparks = [];
    const anchors = resample(pts, 40);
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

    // A real breath: quick draw, long release, and a period that wanders, so
    // successive breaths are not the same length.
    const br = breath(t, 5.2, c.phase);

    halo(c, cx, cy, H * (0.80 + br * 0.12), e);
    halftone(c, cx, cy, H * 0.95, 23, 0.045 * e);

    const breathe = 1 + (br - 0.5) * 0.042;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${CYAN}, ${0.34 * e})`;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = cx + (pts[i][0] - cx) * breathe;
      const y = cy + (pts[i][1] - cy) * breathe;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';

    // Not a constant sweep: the head speeds up and eases off, so the light
    // travelling the contour has weight instead of running at a fixed rate.
    const head = ((t * 0.11) + drift(t, 0.19, c.phase) * 0.06) % 1;
    for (let i = 0; i < pts.length; i += 2) {
      const u = i / pts.length;
      let dd = Math.abs(u - head);
      if (dd > 0.5) dd = 1 - dd;
      const k = Math.max(0, 1 - dd / 0.16);
      let x = cx + (pts[i][0] - cx) * breathe;
      let y = cy + (pts[i][1] - cy) * breathe;

      // The fire notices the pointer.
      const p = pull(c, x, y, H * 0.7, 10);
      x += p.dx;
      y += p.dy;

      dab(c, x, y, 5 + k * 12 + p.lift * 3, (0.14 + k * 0.5) * e * (1 + p.lift * 1.4));
    }

    // Sparks lift off the contour and fade, the one thing that leaves the mark.
    for (const s of sparks) {
      const life = ((t + s.t0) * s.sp) % 1;
      const p = pts[s.i];
      const y = p[1] - life * H * 0.36;
      const x = p[0] + s.drift * life + drift(t, 0.4, s.t0) * 4 * life;
      dab(c, x, y, 4 + (1 - life) * 3, (1 - life) * (1 - life) * 0.55 * e);
    }

    dab(c, cx, cy + H * 0.18, H * 0.44, 0.13 * e * (0.85 + br * 0.3));

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
