import { RISK_CONFIG, type RiskConfig } from './config';
import type { Hotspot, Scene } from './scenes';

export interface RiskState {
  timeLeftMs: number;
  /** Ids of the risks found, in the order found. */
  found: string[];
  /** Where taps missed, in scene units, in order. */
  misses: { x: number; y: number }[];
  over: boolean;
  endReason: 'all-found' | 'time-up' | null;
}

export type RiskAction =
  /** Time passed, in ms (from requestAnimationFrame). */
  | { type: 'TICK'; ms: number }
  /** A tap on the scene, in scene units. */
  | { type: 'TAP'; x: number; y: number };

export function initialRiskState(cfg: RiskConfig = RISK_CONFIG): RiskState {
  return { timeLeftMs: cfg.roundMs, found: [], misses: [], over: false, endReason: null };
}

/**
 * The risk at a point, if any: the nearest one whose circle (plus `slop` for fingers that land close) contains it.
 */
export function hitTest(scene: Scene, x: number, y: number, slop = 0): Hotspot | null {
  let best: Hotspot | null = null;
  let bestDistance = Infinity;
  for (const spot of scene.hotspots) {
    const distance = Math.hypot(spot.x - x, spot.y - y);
    if (distance <= spot.r + slop && distance < bestDistance) {
      best = spot;
      bestDistance = distance;
    }
  }
  return best;
}

/** 100 per risk found, plus a time bonus for finding them all. */
export function riskScore(state: RiskState, cfg: RiskConfig = RISK_CONFIG): number {
  const bonus = state.endReason === 'all-found' ? Math.floor(state.timeLeftMs / 1000) * cfg.timeBonusPerSecond : 0;
  return state.found.length * cfg.pointsPerRisk + bonus;
}

/**
 * Pure game state machine for one scene. TICK runs the clock down; TAP finds a risk, or costs time if it hits
 * nothing (tapping an already-found risk again costs nothing). The round ends when every risk is found or the
 * time runs out.
 */
export function createRiskReducer(scene: Scene, cfg: RiskConfig = RISK_CONFIG) {
  const endIfTimeUp = (state: RiskState): RiskState =>
    state.timeLeftMs > 0 ? state : { ...state, timeLeftMs: 0, over: true, endReason: 'time-up' };

  return function riskReducer(state: RiskState, action: RiskAction): RiskState {
    if (state.over) return state;
    switch (action.type) {
      case 'TICK':
        return endIfTimeUp({ ...state, timeLeftMs: state.timeLeftMs - Math.min(Math.max(0, action.ms), cfg.maxTickMs) });
      case 'TAP': {
        const spot = hitTest(scene, action.x, action.y, cfg.touchSlop);
        if (spot && state.found.includes(spot.id)) return state;
        if (spot) {
          const found = [...state.found, spot.id];
          const allFound = found.length === scene.hotspots.length;
          return { ...state, found, over: allFound, endReason: allFound ? 'all-found' : null };
        }
        return endIfTimeUp({
          ...state,
          timeLeftMs: state.timeLeftMs - cfg.missPenaltyMs,
          misses: [...state.misses, { x: action.x, y: action.y }],
        });
      }
    }
  };
}
