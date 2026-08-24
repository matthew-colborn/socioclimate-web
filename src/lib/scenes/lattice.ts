/**
 * Branshe — the partnership case study.
 *
 * Two lattices, counter-rotating, drawing connections only where their points
 * come close. Neither is absorbed into the other; the mesh exists only where
 * they meet, and it forms and dissolves as they turn. That is the claim the
 * entry is making, so both structures have to stay legible as structures —
 * scattered dim points would say nothing.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, CYAN, GLOW } from '../field/prims';

interface Node { x: number; y: number; r: number; a: number }

let A: Node[] = [];
let B: Node[] = [];
let cx = 0, cy = 0, R = 0;

/** A ring lattice: concentric rings of evenly spaced points. */
function build(rings: number, base: number, R: number, jitter: () => number): Node[] {
  const out: Node[] = [];
  for (let i = 1; i <= rings; i++) {
    const rad = (i / rings) * R;
    const count = base + i * 5;
    for (let j = 0; j < count; j++) {
      out.push({
        x: 0,
        y: 0,
        r: rad * (0.96 + jitter() * 0.08),
        a: (j / count) * Math.PI * 2,
      });
    }
  }
  return out;
}

export const lattice: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.44;
    R = Math.min(c.w * 0.30, c.h * 0.40, 330);
    A = build(3, 8, R, c.rng);
    B = build(3, 8, R * 0.80, c.rng);
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, cx, cy, R * 1.9, e);
    halftone(c, cx, cy, R * 1.8, 23, 0.045 * e);

    const rotA = t * 0.055;
    const rotB = -t * 0.043;
    for (const n of A) {
      n.x = cx + Math.cos(n.a + rotA) * n.r;
      n.y = cy + Math.sin(n.a + rotA) * n.r * 0.80;
    }
    for (const n of B) {
      n.x = cx + Math.cos(n.a + rotB) * n.r;
      n.y = cy + Math.sin(n.a + rotB) * n.r * 0.86;
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    // Each lattice's own ring structure, so both read as structures.
    ctx.lineWidth = 1;
    for (const [set, alpha] of [[A, 0.22], [B, 0.16]] as Array<[Node[], number]>) {
      ctx.strokeStyle = `rgba(${CYAN}, ${alpha * e})`;
      ctx.beginPath();
      for (let i = 0; i < set.length - 1; i++) {
        const a = set[i], b = set[i + 1];
        if (Math.abs(a.r - b.r) > 1) continue;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
    }

    // The mesh, only where the two are close.
    const near = R * 0.26;
    for (const a of A) {
      for (const b of B) {
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > near * near) continue;
        const k = 1 - Math.sqrt(d2) / near;
        ctx.strokeStyle = `rgba(${GLOW}, ${k * k * 0.42 * e})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const n of A) dab(c, n.x, n.y, 9, 0.34 * e);
    for (const n of B) dab(c, n.x, n.y, 7, 0.26 * e);
    dab(c, cx, cy, R * 0.5, 0.12 * e);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${GLOW}, ${0.7 * e})`;
    for (const n of A) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = `rgba(${CYAN}, ${0.7 * e})`;
    for (const n of B) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
