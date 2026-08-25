/**
 * Contact — a threshold rather than an object.
 *
 * The flame used to sit here, and a mark loses its weight when it appears twice
 * on one page. It belongs at the top; this needed to be something else.
 *
 * I took the suggestion rather than proposing an alternative, because it was
 * the right one: brand/references/ref-1 is a lit doorway standing in a
 * landscape, and a way through is exactly what a contact section is. An object
 * asks to be looked at; an opening asks to be walked into.
 *
 * Still derived from the mark. The aperture's two jambs are the flame's own
 * silhouette read as a vertical profile and mirrored, so the opening is
 * literally the shape of the flame held apart — the sides carry its
 * curvature rather than being drawn as a plain rectangle. Points drift toward
 * the gap and accelerate as they pass through, which is the only motion in it.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameProfile, pull, CYAN, GLOW, TEAL } from '../field/prims';
import { drift, breath } from '../field/life';

const ROWS = 46;
const MOTES = 34;

interface Mote { t0: number; sp: number; off: number; side: number }

let jamb: number[] = [];
let motes: Mote[] = [];
let cx = 0, cy = 0, hgt = 0, half = 0, sill = 0;

export const threshold: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.46;
    hgt = Math.min(c.h * 0.66, c.w * 1.0, 340);
    sill = cy + hgt * 0.5;
    half = hgt * 0.26;

    // The flame's silhouette, read top-to-bottom, becomes the inner edge of
    // each jamb — so the opening widens and narrows the way the mark does.
    const raw = flameProfile(ROWS);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    // Smoothed hard. Raw column noise on a jamb reads as a jagged glitch, not
    // as a doorway — the mark should give the opening its taper, not its
    // texture.
    const pass = (a: number[]): number[] =>
      a.map((_, i) => (a[Math.max(0, i - 1)] + a[i] * 2 + a[Math.min(a.length - 1, i + 1)]) / 4);
    let n = raw.map((v) => (v - lo) / ((hi - lo) || 1));
    for (let k = 0; k < 6; k++) n = pass(n);
    // A gentle taper: widest around two thirds up, closing toward the lintel.
    jamb = n.map((v, i) => {
      const u = i / (ROWS - 1);
      const taper = Math.sin(Math.min(1, u * 1.06) * Math.PI * 0.82 + 0.28);
      return 0.55 + 0.45 * v * taper;
    });

    motes = [];
    for (let i = 0; i < MOTES; i++) {
      motes.push({
        t0: c.rng() * 6,
        sp: 0.16 + c.rng() * 0.16,
        off: (c.rng() - 0.5) * hgt * 0.9,
        side: c.rng() < 0.5 ? -1 : 1,
      });
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);

    // Its own period again, slower than the scenes above it.
    const br = breath(t, 7.4, c.phase);
    const open = 0.86 + br * 0.28;

    halo(c, cx, sill - hgt * 0.34, hgt * (0.62 + br * 0.14), e * 0.9);
    halftone(c, cx, cy, hgt * 0.9, 24, 0.035 * e);

    ctx.globalCompositeOperation = 'lighter';

    // ---- the light coming through ---------------------------------------
    // Brightest at the sill and falling away upward, the way ref-1's portal
    // spills onto the ground in front of it.
    const gap = ctx.createLinearGradient(0, sill, 0, cy - hgt * 0.5);
    gap.addColorStop(0, `rgba(${GLOW}, ${0.4 * e * open})`);
    gap.addColorStop(0.45, `rgba(${CYAN}, ${0.22 * e * open})`);
    gap.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.globalAlpha = 1;
    ctx.fillStyle = gap;
    ctx.beginPath();
    for (let i = 0; i < ROWS; i++) {
      const v = i / (ROWS - 1);
      const y = sill - v * hgt;
      ctx.lineTo(cx - half * jamb[i] * open, y);
    }
    for (let i = ROWS - 1; i >= 0; i--) {
      const v = i / (ROWS - 1);
      const y = sill - v * hgt;
      ctx.lineTo(cx + half * jamb[i] * open, y);
    }
    ctx.closePath();
    ctx.fill();

    // ---- the jambs -------------------------------------------------------
    for (const side of [-1, 1]) {
      ctx.strokeStyle = `rgba(${CYAN}, ${0.5 * e})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < ROWS; i++) {
        const v = i / (ROWS - 1);
        const y = sill - v * hgt;
        const x = cx + side * half * jamb[i] * open;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();

      // The outer wall, receding — it gives the opening something to be an
      // opening in, without drawing a box around it.
      const wall = ctx.createLinearGradient(cx + side * half, 0, cx + side * hgt * 0.62, 0);
      wall.addColorStop(0, `rgba(${TEAL}, ${0.34 * e})`);
      wall.addColorStop(1, `rgba(${TEAL}, 0)`);
      ctx.strokeStyle = wall;
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        for (let i = 0; i < ROWS; i += 2) {
          const v = i / (ROWS - 1);
          const y = sill - v * hgt;
          const x = cx + side * (half * jamb[i] * open + k * hgt * 0.075);
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }

    // ---- the sill --------------------------------------------------------
    const line = ctx.createLinearGradient(cx - hgt * 0.7, 0, cx + hgt * 0.7, 0);
    line.addColorStop(0, `rgba(${CYAN}, 0)`);
    line.addColorStop(0.5, `rgba(${GLOW}, ${0.42 * e})`);
    line.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.strokeStyle = line;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - hgt * 0.7, sill);
    ctx.lineTo(cx + hgt * 0.7, sill);
    ctx.stroke();
    dab(c, cx, sill, hgt * 0.7, 0.12 * e * open);

    // ---- what goes through -----------------------------------------------
    for (const m of motes) {
      const life = ((t + m.t0) * m.sp) % 1;
      // Accelerating toward the gap, then gone: passing through, not orbiting.
      const k = life * life;
      const startX = cx + m.side * hgt * (0.62 + drift(t, 0.05, m.t0) * 0.06);
      const x = startX + (cx - startX) * k;
      const y = sill - hgt * 0.12 + m.off * (1 - k) * 0.5 - k * hgt * 0.22;
      const p = pull(c, x, y, hgt * 0.6, 8);
      dab(c, x + p.dx, y + p.dy, 3 + k * 2.4 + p.lift * 2, (1 - k) * 0.5 * e * (1 + p.lift));
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
