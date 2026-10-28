import { describe, expect, it } from 'vitest';
import { swipeVerdict } from './swipe';

const cfg = { thresholdPx: 80, flickVelocity: 500 };

describe('swipeVerdict', () => {
  it('left past the threshold is Phish, right is Safe', () => {
    expect(swipeVerdict(-80, 0, cfg)).toBe('phish');
    expect(swipeVerdict(120, 0, cfg)).toBe('safe');
  });

  it('snaps back when the drag is short and slow', () => {
    expect(swipeVerdict(-79, -100, cfg)).toBeNull();
    expect(swipeVerdict(30, 200, cfg)).toBeNull();
    expect(swipeVerdict(0, 900, cfg)).toBeNull();
  });

  it('counts a short, fast flick', () => {
    expect(swipeVerdict(-20, -600, cfg)).toBe('phish');
    expect(swipeVerdict(20, 500, cfg)).toBe('safe');
  });

  it('ignores a flick back towards the middle', () => {
    expect(swipeVerdict(-40, 800, cfg)).toBeNull();
  });
});
