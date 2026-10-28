import { PHISH_CONFIG, type TierConfig } from './config';
import { MAX_BODY_WORDS } from './schema';

/**
 * Time to answer one email, in ms: max(minTime, startTime * decay^steps), then stretched a little for
 * longer emails so they aren't unfair. Steps are the correct answers so far (tier timer) or the overtime
 * cards so far (overtime).
 */
export function cardTimeMs(
  curve: Pick<TierConfig, 'startTimeMs' | 'minTimeMs' | 'decay'>,
  steps: number,
  bodyWords: number,
  wordTimeBonus = PHISH_CONFIG.wordTimeBonus,
): number {
  const base = Math.max(curve.minTimeMs, curve.startTimeMs * curve.decay ** steps);
  const length = Math.min(bodyWords, MAX_BODY_WORDS) / MAX_BODY_WORDS;
  return Math.round(base * (1 + wordTimeBonus * length));
}
