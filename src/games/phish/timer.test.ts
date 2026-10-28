import { describe, expect, it } from 'vitest';
import { PHISH_CONFIG, type TierConfig } from './config';
import { cardTimeMs } from './timer';

const tier: TierConfig = {
  label: 'Test',
  hint: '',
  startTimeMs: 10_000,
  minTimeMs: 4_000,
  decay: 0.5,
  scoreMultiplier: 1,
  poolWeights: { 1: 1, 2: 1, 3: 1 },
};

describe('cardTimeMs', () => {
  it('starts at startTime', () => {
    expect(cardTimeMs(tier, 0, 0, 0)).toBe(10_000);
  });

  it('decays with each correct answer', () => {
    expect(cardTimeMs(tier, 1, 0, 0)).toBe(5_000);
  });

  it('never drops below minTime', () => {
    expect(cardTimeMs(tier, 2, 0, 0)).toBe(4_000);
    expect(cardTimeMs(tier, 50, 0, 0)).toBe(4_000);
  });

  it('gives longer emails more time, up to the full bonus at the word limit', () => {
    expect(cardTimeMs(tier, 0, 30, 0.3)).toBe(11_500);
    expect(cardTimeMs(tier, 0, 60, 0.3)).toBe(13_000);
    expect(cardTimeMs(tier, 0, 200, 0.3)).toBe(13_000);
  });

  it('applies the word bonus on top of the minimum', () => {
    expect(cardTimeMs(tier, 50, 60, 0.5)).toBe(6_000);
  });

  it("gives the booth's time trial 10s for email 6, about 2s for email 25 and less after, with no floor", () => {
    const ot = PHISH_CONFIG.overtime;
    expect(cardTimeMs(ot, 0, 0, 0)).toBe(10_000);
    expect(cardTimeMs(ot, 25 - 6, 0, 0)).toBe(2_051);
    expect(cardTimeMs(ot, 40 - 6, 0, 0)).toBeLessThan(1_000);
    expect(cardTimeMs(ot, 60 - 6, 0, 0)).toBeLessThan(cardTimeMs(ot, 59 - 6, 0, 0));
  });
});
