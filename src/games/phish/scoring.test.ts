import { describe, expect, it } from 'vitest';
import type { ScoringConfig } from './config';
import { pointsForCorrect, streakMultiplier } from './scoring';

const cfg: ScoringConfig = { basePoints: 100, streakStep: 0.1, streakCap: 2 };

describe('streakMultiplier', () => {
  it('is 1x with no streak', () => {
    expect(streakMultiplier(0, cfg)).toBe(1);
  });

  it('adds 10% per consecutive correct answer', () => {
    expect(streakMultiplier(1, cfg)).toBeCloseTo(1.1);
    expect(streakMultiplier(5, cfg)).toBeCloseTo(1.5);
  });

  it('is capped', () => {
    expect(streakMultiplier(10, cfg)).toBe(2);
    expect(streakMultiplier(50, cfg)).toBe(2);
  });

  it('respects a different cap and step', () => {
    expect(streakMultiplier(10, { ...cfg, streakStep: 0.05, streakCap: 1.25 })).toBe(1.25);
  });

  it('treats a negative streak as zero', () => {
    expect(streakMultiplier(-3, cfg)).toBe(1);
  });
});

describe('pointsForCorrect', () => {
  it('awards base points with no streak', () => {
    expect(pointsForCorrect(0, cfg)).toBe(100);
  });

  it('applies the streak multiplier and rounds to whole points', () => {
    expect(pointsForCorrect(3, cfg)).toBe(130);
  });

  it('applies the tier multiplier', () => {
    expect(pointsForCorrect(0, cfg, 1.5)).toBe(150);
  });

  it('stacks tier and capped streak multipliers', () => {
    expect(pointsForCorrect(25, cfg, 2)).toBe(400);
  });
});
