/**
 * The /contact field. Same vocabulary as the hero scenes, but its state is the
 * visitor's answers rather than time: each condition met adds a ring of nodes
 * and tightens the mesh. Answering feels like the field responding, which is
 * the whole point of scoring live rather than at submit.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, CYAN, GLOW } from '../field/prims';

interface Node { a: number; r: number; ring: number }

let nodes: Node[] = [];
let cx = 0, cy = 0, R = 0;

/** 0..1, how much of the moat is present. Set from outside as answers change. */
export const state = { score: 0, target: 0, total: 5 };

export const diagnosticField: Scene = {
  init(c: SceneCtx) {
    // On a wide viewport the questions occupy the left column, so the field
    // sits right of them rather than underneath — the same object-and-text
    // relationship the hero has.
    cx = c.w > 900 ? c.w * 0.72 : c.w / 2;
    cy = c.h * (c.w > 900 ? 0.42 : 0.5);
    R = Math.min(c.w * (c.w > 900 ? 0.26 : 0.42), c.h * 0.34, 340);
    nodes = [];
    for (let ring = 0; ring < 5; ring++) {
      const count = 6 + ring * 4;
      for (let i = 0; i < count; i++) {
        nodes.push({
          a: (i / count) * Math.PI * 2 + ring * 0.35,
          r: ((ring + 1) / 5) * R,
          ring,
        });
      }
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);

    // Ease toward the answered score rather than snapping — the field settles.
    state.score += (state.target - state.score) * 0.08;
    const filled = state.score;

    halo(c, cx, cy, R * (1.2 + filled * 0.4), (0.55 + filled * 0.45) * e);
    halftone(c, cx, cy, R * 1.6, 23, (0.035 + filled * 0.03) * e);

    const pts = nodes.map((n) => {
      const live = filled - n.ring;
      const k = live <= 0 ? 0 : live > 1 ? 1 : live;
      // Floor so the lattice is present before a single answer. It has to look
      // like something waiting to respond, not like an empty page.
      const vis = 0.30 + k * 0.70;
      const wob = Math.sin(t * 0.5 + n.a * 3 + n.ring) * (1 - k) * 6;
      return {
        x: cx + Math.cos(n.a + t * 0.03 * (n.ring % 2 ? 1 : -1)) * (n.r + wob),
        y: cy + Math.sin(n.a + t * 0.03 * (n.ring % 2 ? 1 : -1)) * (n.r + wob) * 0.9,
        k,
        vis,
      };
    });

    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const k = Math.min(pts[i].vis, pts[j].vis);
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d > R * 0.32) continue;
        ctx.strokeStyle = `rgba(${CYAN}, ${(1 - d / (R * 0.32)) * k * 0.34 * e})`;
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const p of pts) dab(c, p.x, p.y, 5 + p.k * 7, (0.10 + p.k * 0.38) * e);
    dab(c, cx, cy, 40 + filled * 44, (0.10 + filled * 0.13) * e);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${GLOW}, ${0.5 * e})`;
    for (const p of pts) {
      if (p.vis < 0.5) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
