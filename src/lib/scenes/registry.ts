import type { Scene } from '../field/engine';
import { flame } from './flame';
import { ridge } from './ridge';
import { traces_scene } from './traces';
import { converge } from './converge';
import { lattice } from './lattice';
import { threshold } from './threshold';
import { process } from './process';
import { waves } from './waves';

export type SceneId =
  | 'flame' | 'ridge' | 'traces' | 'converge' | 'lattice' | 'threshold'
  | 'process' | 'waves';

/**
 * Every object here is the same traced flame contour under a different
 * transformation. That is why the set reads as one system rather than as six
 * illustrations: the mark on the home page, and four readings of it across the
 * portfolio, plus the threshold on the contact page.
 */
export const SCENES: Record<SceneId, Scene> = {
  flame,
  ridge,
  traces: traces_scene,
  converge,
  lattice,
  threshold,
  process,
  waves,
};

/** Fixed per scene so a poster frame and the first animated frame agree. */
export const SEEDS: Record<SceneId, number> = {
  flame: 10110,
  ridge: 20260821,
  traces: 71104,
  converge: 33871,
  lattice: 54029,
  threshold: 60627,
  process: 81140,
  waves: 46201,
};
