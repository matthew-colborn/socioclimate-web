import type { Scene } from '../field/engine';
import { ridge } from './ridge';
import { traces_scene } from './traces';
import { converge } from './converge';
import { lattice } from './lattice';

export type SceneId = 'ridge' | 'traces' | 'converge' | 'lattice';

export const SCENES: Record<SceneId, Scene> = {
  ridge,
  traces: traces_scene,
  converge,
  lattice,
};

/** Fixed per scene so a poster frame and the first animated frame agree. */
export const SEEDS: Record<SceneId, number> = {
  ridge: 20260821,
  traces: 71104,
  converge: 33871,
  lattice: 54029,
};
