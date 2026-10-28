import { PHISH_CONFIG, type ScoringConfig } from './config';

/**
 * Multiplier for a correct answer, given how many correct answers came right before it.
 * With the default config: 1x, 1.1x, 1.2x ... capped at 2x.
 */
export function streakMultiplier(streak: number, cfg: ScoringConfig = PHISH_CONFIG.scoring): number {
  return Math.min(cfg.streakCap, 1 + cfg.streakStep * Math.max(0, streak));
}

/** Points for a correct answer. Wrong answers and timeouts score 0. */
export function pointsForCorrect(
  streak: number,
  cfg: ScoringConfig = PHISH_CONFIG.scoring,
  tierMultiplier = 1,
): number {
  return Math.round(cfg.basePoints * tierMultiplier * streakMultiplier(streak, cfg));
}
