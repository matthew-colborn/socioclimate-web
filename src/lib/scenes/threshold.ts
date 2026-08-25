/**
 * Contact — a gateway. A way through rather than an object to look at.
 *
 * The flame used to sit here, and a mark loses its weight when it appears twice
 * on one page. It belongs at the top; this needed to be something else.
 *
 * The first attempt at this was a tall aperture with two curved, mirrored
 * sides, and it read as anatomy rather than architecture — a fair call, and an
 * obvious one once seen. Symmetry plus a vertical slit plus a soft interior
 * glow will always land there. The fix is to make it unmistakably built: a
 * straight-sided opening with a lintel across the top, standing on a ground
 * plane, with the light falling out of it and along the floor. That is what a
 * portal is in brand/references/ref-1, and a lintel is the single element that
 * makes the shape read as a doorway.
 *
 * Still derived from the mark: the light inside the opening is shaped by the
 * flame's own profile, and the glow pooling on the floor carries the ridge's
 * silhouette. The structure is architecture; the light in it is the flame.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameProfile, pull, CYAN, GLOW, TEAL } from '../field/prims';
import { drift, breath } from '../field/life';

const MOTES = 30;
const BEAM = 40;

interface Mote { t0: number; sp: number; off: number; side: number }

let lightProf: number[] = [];
let motes: Mote[] = [];
let cx = 0, floorY = 0, apW = 0, apH = 0, jambT = 0;

export const threshold: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    const unit = Math.min(c.h * 0.62, c.w * 0.78, 320);
    apH = unit;
    // Wider than a slit and clearly rectangular: a doorway, roughly 1 : 1.7.
    apW = unit * 0.58;
    jambT = unit * 0.085;
    floorY = c.h * 0.5 + apH * 0.5;

    const raw = flameProfile(BEAM);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    lightProf = raw.map((v) => 0.3 + 0.7 * ((v - lo) / ((hi - lo) || 1)));

    motes = [];
    for (let i = 0; i < MOTES; i++) {
      motes.push({
        t0: c.rng() * 6,
        sp: 0.14 + c.rng() * 0.14,
        off: c.rng(),
        side: c.rng() < 0.5 ? -1 : 1,
      });
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);
    const br = breath(t, 7.4, c.phase);
    const lit = 0.84 + br * 0.32;

    const left = cx - apW / 2;
    const right = cx + apW / 2;
    const head = floorY - apH;

    halo(c, cx, floorY - apH * 0.45, apH * (0.6 + br * 0.12), e * 0.85);
    halftone(c, cx, floorY - apH * 0.4, apH * 0.9, 24, 0.03 * e);

    ctx.globalCompositeOperation = 'lighter';

    // ---- the ground ------------------------------------------------------
    // Lines running to the opening, converging slightly, so the portal is
    // standing on something and being approached.
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    for (let k = 1; k <= 5; k++) {
      const y = floorY + k * apH * 0.055;
      const spread = 1 + k * 0.16;
      ctx.strokeStyle = `rgba(${TEAL}, ${(0.34 - k * 0.05) * e})`;
      ctx.beginPath();
      ctx.moveTo(cx - apW * spread * 1.1, y);
      ctx.lineTo(cx + apW * spread * 1.1, y);
      ctx.stroke();
    }

    // ---- the light through the opening -----------------------------------
    // Shaped by the flame's own profile across the width, so what comes
    // through the door is the mark even though the door is not.
    for (let i = 0; i < BEAM; i++) {
      const u = i / (BEAM - 1);
      const x = left + u * apW;
      // Overlapped generously: at DPR 3 a 1px overlap still leaves seams, and
      // a striped doorway reads as a barcode rather than as light.
      const w = apW / BEAM + 3;
      const a = lightProf[i] * 0.16 * lit * e;
      const col = ctx.createLinearGradient(0, head, 0, floorY);
      col.addColorStop(0, `rgba(${CYAN}, 0)`);
      col.addColorStop(0.55, `rgba(${CYAN}, ${a})`);
      col.addColorStop(1, `rgba(${GLOW}, ${a * 1.9})`);
      ctx.fillStyle = col;
      ctx.fillRect(x - 1.5, head, w, apH);
    }

    // Light spilling out across the floor. Radial, not a rectangle — a hard
    // edged box of light reads as a UI panel sitting in the scene.
    const spill = ctx.createRadialGradient(cx, floorY, 0, cx, floorY, apW * 1.15);
    spill.addColorStop(0, `rgba(${GLOW}, ${0.22 * lit * e})`);
    spill.addColorStop(0.5, `rgba(${CYAN}, ${0.08 * lit * e})`);
    spill.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.fillStyle = spill;
    ctx.fillRect(cx - apW * 1.15, floorY, apW * 2.3, apW * 1.15);

    // ---- the structure ---------------------------------------------------
    // Straight jambs and a lintel that overhangs them. The overhang is what
    // makes it architecture rather than a gap between two shapes.
    ctx.strokeStyle = `rgba(${CYAN}, ${0.62 * e})`;
    ctx.lineWidth = 1.4;
    for (const x of [left, right]) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x, head);
      ctx.stroke();
      // Depth: the jamb has a thickness turned toward the viewer.
      ctx.strokeStyle = `rgba(${TEAL}, ${0.5 * e})`;
      ctx.beginPath();
      ctx.moveTo(x + (x === left ? -jambT : jambT), floorY);
      ctx.lineTo(x + (x === left ? -jambT : jambT), head - jambT * 0.5);
      ctx.stroke();
      ctx.strokeStyle = `rgba(${CYAN}, ${0.62 * e})`;
    }

    // The lintel, overhanging both jambs.
    ctx.beginPath();
    ctx.moveTo(left - jambT * 1.5, head);
    ctx.lineTo(right + jambT * 1.5, head);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${TEAL}, ${0.5 * e})`;
    ctx.beginPath();
    ctx.moveTo(left - jambT * 1.5, head - jambT * 0.5);
    ctx.lineTo(right + jambT * 1.5, head - jambT * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left - jambT * 1.5, head);
    ctx.lineTo(left - jambT * 1.5, head - jambT * 0.5);
    ctx.moveTo(right + jambT * 1.5, head);
    ctx.lineTo(right + jambT * 1.5, head - jambT * 0.5);
    ctx.stroke();

    // The threshold itself: the brightest line in the scene.
    const sill = ctx.createLinearGradient(left, 0, right, 0);
    sill.addColorStop(0, `rgba(${CYAN}, ${0.3 * e})`);
    sill.addColorStop(0.5, `rgba(${GLOW}, ${0.7 * lit * e})`);
    sill.addColorStop(1, `rgba(${CYAN}, ${0.3 * e})`);
    ctx.strokeStyle = sill;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(left, floorY);
    ctx.lineTo(right, floorY);
    ctx.stroke();
    dab(c, cx, floorY, apW * 1.5, 0.1 * lit * e);

    // ---- what goes through -----------------------------------------------
    for (const m of motes) {
      const life = ((t + m.t0) * m.sp) % 1;
      const k = life * life;              // accelerating: passing through
      const sx = cx + m.side * apW * (1.5 + drift(t, 0.05, m.t0) * 0.2);
      const x = sx + (cx - sx) * k;
      const y = floorY - apH * (0.08 + m.off * 0.55) - k * apH * 0.1;
      const p = pull(c, x, y, apH * 0.55, 8);
      dab(c, x + p.dx, y + p.dy, 2.8 + k * 2 + p.lift * 2, (1 - k) * 0.45 * e * (1 + p.lift));
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },
};
