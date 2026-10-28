import { describe, expect, it } from 'vitest';
import { mulberry32, nextRandom } from './rng';

describe('rng', () => {
  it('matches the original mulberry32 sequence from Phish or Safe', () => {
    // First values of Phish or Safe's mulberry32(7), which drew its homepage layout.
    let a = 7;
    const original = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const rng = mulberry32(7);
    for (let i = 0; i < 20; i++) expect(rng()).toBe(original());
  });

  it('nextRandom is pure: the same seed gives the same value and next seed', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
    const [value, next] = nextRandom(42);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
    expect(next).not.toBe(42);
  });
});
