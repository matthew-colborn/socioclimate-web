/**
 * Deed-Restricted DB.
 *
 * A parcel histogram rising into a ridge — the data-ridge motif from the
 * horizontal lockup. The ridge breathes. One horizontal line across it does
 * not move at all, ever: that is the administratively-set price, which in the
 * observed listings never changed no matter how long a unit sat. The scene is
 * the finding.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, annotate, ease, flameProfile, CYAN, GLOW } from '../field/prims';

interface Bar { x: number; base: number; h: number; phase: number; locked: boolean }

let bars: Bar[] = [];
let cx = 0, cy = 0, span = 0;

export const ridge: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.46;
    span = Math.min(c.w * 0.86, c.h * 1.9, 760);
    const n = Math.max(48, Math.min(120, Math.round(span / 7)));
    // The bar heights are the flame's own upper silhouette, column by column.
    // The ridge is not noise shaped to look like the mark — it is the mark,
    // read as a histogram.
    const profile = flameProfile(n);
    bars = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      bars.push({
        x: cx - span / 2 + u * span,
        base: cy + span * 0.16,
        h: profile[i] * span * 0.46,
        phase: c.rng() * Math.PI * 2,
        // A small minority hold their height exactly — the units that never move.
        locked: c.rng() < 0.14,
      });
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, cx, cy, span * 0.62, e);
    halftone(c, cx, cy, span * 0.66, 23, 0.05 * e);

    ctx.globalCompositeOperation = 'lighter';

    let peakX = cx, peakY = cy;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i];
      // Locked bars are perfectly still. Everything else drifts.
      const breathe = b.locked ? 1 : 1 + Math.sin(t * 0.55 + b.phase) * 0.055;
      const h = b.h * breathe * e;
      const top = b.base - h;
      if (top < peakY) { peakY = top; peakX = b.x; }

      const w = span / bars.length;
      const grad = ctx.createLinearGradient(0, b.base, 0, top);
      grad.addColorStop(0, `rgba(${CYAN}, 0)`);
      grad.addColorStop(1, `rgba(${CYAN}, ${b.locked ? 0.5 : 0.3})`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(b.x - w * 0.34, top, w * 0.68, h);

      dab(c, b.x, top, b.locked ? 9 : 6, (b.locked ? 0.5 : 0.26) * e);
    }

    // The line that never moves. Drawn dead flat, at a fixed height, with no
    // time term anywhere in it.
    const flat = c.h * 0.40;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${GLOW}, ${0.5 * e})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([1, 5]);
    ctx.beginPath();
    ctx.moveTo(cx - span / 2, flat);
    ctx.lineTo(cx + span / 2, flat);
    ctx.stroke();
    ctx.setLineDash([]);

    annotate(c, cx + span / 2, flat, 26, -18, 0.4 * e);
    annotate(c, cx - span / 2 - 26, peakY + 8, 26, -14, 0.28 * e);

    ctx.globalCompositeOperation = 'lighter';
    dab(c, peakX, peakY, 26, 0.34 * e);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
