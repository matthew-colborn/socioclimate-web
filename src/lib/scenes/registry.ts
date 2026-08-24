import type { Scene } from '../field/engine';
import { flame } from './flame';
import { ridge } from './ridge';
import { traces_scene } from './traces';
import { converge } from './converge';
import { lattice } from './lattice';
import { opening } from './opening';

export type SceneId = 'flame' | 'ridge' | 'traces' | 'converge' | 'lattice' | 'opening';

/**
 * Statement, then proof, then invitation. Every object here is the same traced
 * flame contour under a different transformation, which is why the loop coming
 * back to `flame` reads as reassembly rather than as a carousel wrapping.
 */
export const SCENES: Record<SceneId, Scene> = {
  flame,
  ridge,
  traces: traces_scene,
  converge,
  lattice,
  opening,
};

/** Fixed per scene so a poster frame and the first animated frame agree. */
export const SEEDS: Record<SceneId, number> = {
  flame: 10110,
  ridge: 20260821,
  traces: 71104,
  converge: 33871,
  lattice: 54029,
  opening: 60627,
};
