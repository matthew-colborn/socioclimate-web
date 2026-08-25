/**
 * The site background: the ridge from the horizontal lockup, as slow swell.
 *
 * brand/logo-horizontal.jpeg is the reference for the character. The ridge
 * there is not a set of thin lines — it is two or three solid mountain forms
 * with a bright edge along the crest and a filled body falling away beneath.
 * Weight and volume are the point, so this draws few, heavy, filled layers
 * rather than many hairlines.
 *
 * Slow on purpose. Large things move slowly, and that is most of what separates
 * swell from ripple: the travelling term runs at about a fifth of what it did
 * and the breath is an eleven-second cycle. Fast motion at this scale reads as
 * a screensaver, which is the opposite of what it is for.
 *
 * Still ground, not figure. Peak alpha stays low enough that text over it clears
 * AA — scripts/scene-check.mjs measures that against real composited pixels and
 * fails the run if it slips.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { flameProfile, CYAN, GLOW } from '../field/prims';
import { drift, breath } from '../field/life';

/** Four layers, not ten rows. Fewer and heavier is the brief. */
const LAYERS = 4;
/** Samples along each crest. Enough for a smooth curve, no more. */
const STEPS = 88;

/** How far a crest lifts toward the pointer, and how wide that reach is. */
const PULL_LIFT = 26;
const PULL_REACH = 0.26;

let prof: number[] = [];
let W = 0, H = 0;

export const waves: Scene = {
  init(c: SceneCtx) {
    W = c.w;
    H = c.h;

    const raw = flameProfile(STEPS);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const norm = raw.map((v) => Math.pow((v - lo) / ((hi - lo) || 1), 1.2));
    // Smoothed twice: the lockup's peaks are broad and rounded, and the raw
    // column noise reads as dither at this scale rather than as terrain.
    const pass = (a: number[]): number[] =>
      a.map((_, i) => (a[Math.max(0, i - 1)] + a[i] * 2 + a[Math.min(a.length - 1, i + 1)]) / 4);
    prof = pass(pass(norm));
  },

  frame(c: SceneCtx, t: number) {
    const { ctx } = c;

    // Eleven seconds. The swell should feel unhurried.
    const br = breath(t, 11, 1.9);

    const floor = H * 1.04;
    const horizon = H * 0.3;

    ctx.globalCompositeOperation = 'lighter';

    // ---- atmosphere ------------------------------------------------------
    // ref-2 is a luminous field that lightens toward what it holds, and that
    // lift is most of why it reads as depth rather than as a dark page.
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

    // The far distance the swell recedes to.
    const hor = ctx.createLinearGradient(0, 0, W, 0);
    hor.addColorStop(0, `rgba(${CYAN}, 0)`);
    hor.addColorStop(0.5, `rgba(${GLOW}, ${0.05 + br * 0.02})`);
    hor.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.fillStyle = hor;
    ctx.fillRect(0, horizon - 1, W, 2);

    // ---- the swell -------------------------------------------------------
    // Back to front, so nearer layers sit over further ones and the stack reads
    // as depth rather than as overlapping curves.
    for (let L = LAYERS - 1; L >= 0; L--) {
      const d = L / (LAYERS - 1); // 0 = nearest, 1 = furthest
      const baseY = floor - (floor - horizon) * (0.18 + d * 0.62);
      const amp = H * (0.13 - d * 0.055) * (0.85 + br * 0.3);
      const squeeze = 1 - d * 0.22;

      // Each layer travels at its own slow rate and phase, so they never stack
      // into one thick band.
      const speed = 0.11 - d * 0.03;
      const phase = L * 2.1;

      const crest: number[] = [];
      for (let i = 0; i < STEPS; i++) {
        const u = i / (STEPS - 1);
        const x = W * 0.5 + (u - 0.5) * W * 1.08 * squeeze;

        // Two slow components plus the mark's own silhouette as the envelope,
        // which is what gives the crest a few dominant peaks rather than an
        // even ripple.
        const swell =
          Math.sin(u * 3.1 - t * speed + phase) * 0.62 +
          Math.sin(u * 5.7 + t * speed * 0.7 + phase * 1.7) * 0.24 +
          drift(t, 0.03, phase) * 0.14;

        let y = baseY - (0.45 + 0.55 * prof[i]) * amp * (0.6 + swell);

        // The field notices the pointer: a local swell rising toward it that
        // settles once it has gone. c.pstr is already zero under
        // prefers-reduced-motion, so this freezes with everything else. On
        // touch the engine substitutes scroll velocity for pointer strength.
        if (c.pstr > 0.002 && c.px >= 0) {
          const dx = Math.abs(x - c.px) / (W * PULL_REACH);
          if (dx < 1) {
            const g = (1 - dx) * (1 - dx);
            const near = 1 - Math.min(1, Math.abs(y - c.py) / (H * 0.5));
            y -= g * PULL_LIFT * c.pstr * (0.45 + 0.55 * near) * (1 - d * 0.5);
          }
        }
        crest.push(x, y);
      }

      // The body: filled from the crest down, so the form has volume.
      let top = Infinity;
      for (let i = 1; i < crest.length; i += 2) if (crest[i] < top) top = crest[i];
      const fill = ctx.createLinearGradient(0, top, 0, floor);
      // The fill is what lifts the composited background, and at 0.085 it
      // pushed --paper-dim to 4.11:1 — under AA. Turned down here rather than
      // in the crest stroke, because the stroke is what gives the form its
      // definition and the fill is only body.
      const a = (0.05 - d * 0.028) * (0.85 + br * 0.3);
      fill.addColorStop(0, `rgba(${CYAN}, ${a})`);
      fill.addColorStop(0.55, `rgba(${CYAN}, ${a * 0.35})`);
      fill.addColorStop(1, `rgba(${CYAN}, 0)`);

      ctx.globalAlpha = 1;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(crest[0], crest[1]);
      for (let i = 2; i < crest.length; i += 2) ctx.lineTo(crest[i], crest[i + 1]);
      ctx.lineTo(W + 40, floor);
      ctx.lineTo(-40, floor);
      ctx.closePath();
      ctx.fill();

      // The bright edge along the crest — the line that gives the lockup's
      // peaks their definition.
      ctx.strokeStyle = `rgba(${GLOW}, ${(0.1 - d * 0.055) * (0.85 + br * 0.3)})`;
      ctx.lineWidth = 1.4 - d * 0.5;
      ctx.beginPath();
      ctx.moveTo(crest[0], crest[1]);
      for (let i = 2; i < crest.length; i += 2) ctx.lineTo(crest[i], crest[i + 1]);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
