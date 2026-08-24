/**
 * Scene 05 — work with us. The invitation.
 *
 * The same flame contour, drawn twice and drawn apart. Each copy stays a
 * complete outline, so what you see is the mark opening rather than two
 * fragments drifting — a way through rather than an object to look at.
 *
 * The first attempt split the contour into a left and a right half and stroked
 * each. That does not work: the traced path winds, so a filtered half is not a
 * connected run and stroking it in order draws zigzags across the shape. Two
 * whole copies with a displacement weighted toward the seam is the version that
 * reads.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameShape, CYAN, GLOW } from '../field/prims';

let pts: Array<[number, number]> = [];
let cx = 0, cy = 0, H = 0;

export const opening: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.44;
    H = Math.min(c.h * 0.70, c.w * 0.76, 440);
    pts = flameShape(cx, cy, H);
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);

    // Breathes open and closed rather than opening once: an invitation that
    // stays open, not a door that has already been used.
    const open = (0.5 + Math.sin(t * 0.32 - Math.PI / 2) * 0.5) ** 1.3;
    const gap = (6 + open * 30) * e;

    halo(c, cx, cy, H * (0.72 + open * 0.32), (0.6 + open * 0.5) * e);
    halftone(c, cx, cy, H * 0.95, 23, 0.045 * e);

    // The threshold between the two copies: a tapered shaft of light.
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    const gw = Math.max(6, gap * 1.5);
    const g = ctx.createLinearGradient(cx - gw, 0, cx + gw, 0);
    g.addColorStop(0, `rgba(${CYAN}, 0)`);
    g.addColorStop(0.5, `rgba(${GLOW}, ${(0.18 + 0.5 * open) * e})`);
    g.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.fillStyle = g;
    const gh = H * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx - gw, cy);
    ctx.lineTo(cx, cy - gh);
    ctx.lineTo(cx + gw, cy);
    ctx.lineTo(cx, cy + gh);
    ctx.closePath();
    ctx.fill();

    // Motes rising through the opening.
    for (let i = 0; i < 40; i++) {
      const u = (t * 0.15 + i / 40) % 1;
      const x = cx + Math.sin(i * 2.4 + t * 0.3) * gw * 0.7;
      const y = cy + gh * 0.9 - u * gh * 1.8;
      dab(c, x, y, 3 + (1 - u) * 4, (1 - u) * 0.45 * open * e);
    }

    // Two complete copies of the contour, drawn apart. Points nearest the seam
    // travel furthest, so the outline peels rather than slides sideways.
    const shift = (px: number, dir: number): number => {
      const near = 1 - Math.min(1, Math.abs(px - cx) / (H * 0.34));
      return px + dir * gap * (0.45 + near * 0.55);
    };

    ctx.globalCompositeOperation = 'source-over';
    // dab() leaves globalAlpha at the last particle's value. Anything stroked
    // after a run of dabs must reset it or it is multiplied down to nothing —
    // which is exactly what made this outline invisible the first time.
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    for (const dir of [-1, 1]) {
      ctx.strokeStyle = `rgba(${CYAN}, ${0.42 * e})`;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        const x = shift(px, dir);
        i ? ctx.lineTo(x, py) : ctx.moveTo(x, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const dir of [-1, 1]) {
      for (let i = 0; i < pts.length; i += 4) {
        const [px, py] = pts[i];
        const near = 1 - Math.min(1, Math.abs(px - cx) / (H * 0.34));
        dab(c, shift(px, dir), py, 5 + near * 8, (0.14 + near * 0.3) * e);
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
