import { PHISH_CONFIG, type PhishConfig } from './config';
import type { Verdict } from './state';

/**
 * The answer a released drag gives: left = phish, right = safe, or null to snap the card back.
 * It counts if the card went past the threshold, or was flicked fast in the direction it moved.
 */
export function swipeVerdict(
  offsetX: number,
  velocityX: number,
  cfg: PhishConfig['swipe'] = PHISH_CONFIG.swipe,
): Verdict | null {
  const direction = Math.sign(offsetX);
  if (direction === 0) return null;
  const farEnough = Math.abs(offsetX) >= cfg.thresholdPx;
  const flicked = Math.sign(velocityX) === direction && Math.abs(velocityX) >= cfg.flickVelocity;
  if (!farEnough && !flicked) return null;
  return direction < 0 ? 'phish' : 'safe';
}
