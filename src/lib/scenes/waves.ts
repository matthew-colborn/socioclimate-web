/**
 * The site background: the wave surface from beneath the flame, across the
 * whole page.
 *
 * This is the same field the hero ridge dissolves into — rows of points fanning
 * back in perspective, travelling — with the column heights taken from
 * flameProfile, so the undulation carries the mark's own silhouette as its
 * envelope. It is the flame's waves, not a generic particle background.
 *
 * It is deliberately at the edge of visibility. "One moving focal thing per
 * viewport" is the rule that keeps this site from reading as a screensaver, and
 * a background that competes with the scene in front of it breaks that rule
 * just as surely as a second scene would. So: peak alpha around 0.07, no
 * bright points, no glow, nothing that resolves into a shape you could look at
 * directly. If you can find it without looking for it, it is turned up too far.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { flameProfile, CYAN, GLOW } from '../field/prims';
import { drift, breath } from '../field/life';

const ROWS = 10;
/** Points per row. Kept low: this runs on every page, all the time. */
const COLS = 74;

let prof: number[] = [];
let jit: number[] = [];
let W = 0, H = 0;

export const waves: Scene = {
  init(c: SceneCtx) {
    W = c.w;
    H = c.h;

    const raw = flameProfile(COLS);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const norm = raw.map((v) => Math.pow((v - lo) / ((hi - lo) || 1), 1.35));
    // Smoothed, because at background contrast the column-to-column noise just
    // reads as dither rather than as terrain.
    prof = norm.map((_, i) => {
      const a = norm[Math.max(0, i - 1)];
      const b = norm[i];
      const d = norm[Math.min(COLS - 1, i + 1)];
      return (a + b * 2 + d) / 4;
    });

    jit = [];
    for (let i = 0; i < COLS; i++) jit.push(c.rng() * 6.283);
  },

  frame(c: SceneCtx, t: number) {
    const { ctx } = c;

    // Its own breath period again, so the background never syncs with whatever
    // scene is in front of it.
    const br = breath(t, 6.7, 1.9);

    // Low and wide like the ridge under the flame, but fanned far enough back
    // to reach most of the viewport — as a page background, a band along the
    // bottom leaves the top half dead.
    const base = H * 0.94;
    const amp = Math.min(H * 0.15, 150) * (0.85 + br * 0.3);
    const spanY = H * 0.82;

    ctx.globalCompositeOperation = 'lighter';

    // ---- atmosphere ------------------------------------------------------
    // The references are not flat near-black. ref-2 is a luminous blue field
    // that lightens toward whatever it is holding, and that lift is most of
    // why it reads as depth rather than as a dark page. This is that: a wide
    // wash centred a little above the horizon, drifting so it never sits
    // still, kept dim enough that text over it still clears AA.
    const gx = W * (0.5 + drift(t, 0.045, 2.2) * 0.06);
    const gy = H * (0.58 + drift(t, 0.037, 5.1) * 0.05);
    const gr = Math.max(W, H) * (0.78 + br * 0.1);
    const wash = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    wash.addColorStop(0, `rgba(30, 111, 168, ${0.30 + br * 0.05})`);
    wash.addColorStop(0.42, 'rgba(22, 78, 126, 0.15)');
    wash.addColorStop(1, 'rgba(6, 32, 56, 0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);

    // A horizon: the line the wave field recedes to. Thin, wide, and the
    // brightest thing in the backdrop, which is what gives it a far distance.
    const hy = base - spanY * 0.78;
    const hor = ctx.createLinearGradient(0, 0, W, 0);
    hor.addColorStop(0, `rgba(${CYAN}, 0)`);
    hor.addColorStop(0.5, `rgba(${GLOW}, ${0.055 + br * 0.02})`);
    hor.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.fillStyle = hor;
    ctx.fillRect(0, hy - 1, W, 2);

    ctx.lineWidth = 1;

    for (let r = 0; r < ROWS; r++) {
      const d = r / (ROWS - 1);
      // Rows further back are narrower, higher and dimmer: the same perspective
      // fan the hero ridge opens into.
      const persp = 1 - d * 0.34;
      const rowY = base - d * spanY;
      // Fades with depth so the top of the page is quieter than the bottom,
      // which keeps the heaviest text areas the cleanest.
      const a = (0.10 - d * 0.062) * (0.8 + br * 0.4);
      if (a <= 0.002) continue;

      ctx.strokeStyle = `rgba(${CYAN}, ${a})`;
      ctx.beginPath();
      for (let i = 0; i < COLS; i++) {
        const u = i / (COLS - 1);
        const x = W * 0.5 + (u - 0.5) * W * 1.06 * persp;
        // Travelling wave, with the flame's profile as the envelope and a slow
        // layered drift so successive passes are never identical.
        const wave =
          Math.sin(u * 8.4 - t * 0.62 + d * 2.0) * 0.7 +
          drift(t, 0.11, jit[i]) * 0.3;
        const y = rowY + wave * amp * (0.4 + 0.6 * prof[i]) * (0.4 + 0.6 * d);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
