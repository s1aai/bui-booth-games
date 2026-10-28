import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../shell/rng';
import { PASSWORD_CONFIG, type PasswordConfig } from './config';
import { PASSWORDS, type PasswordEntry } from './data';
import {
  charsetSize,
  crackText,
  createPasswordReducer,
  formatDuration,
  gapFor,
  pickPair,
  randomLog10Guesses,
  startState,
  strength,
  strongerSide,
  type Pair,
  type PasswordState,
} from './logic';

const entry = (text: string, log10Guesses: number): PasswordEntry => ({ text, kind: 'common', log10Guesses, why: 'Test' });

// At 1e10 guesses a second: instantly, 10 seconds, ~3 hours, 11.6 days (log10 seconds 0, 1, 4, 6).
const INSTANT = entry('weak', 5);
const TEN_S = entry('ten-seconds', 11);
const HOURS = entry('hours', 14);
const DAYS = entry('days', 16);

const cfg: PasswordConfig = PASSWORD_CONFIG;
const reducer = createPasswordReducer(cfg);

describe('the crack-time model', () => {
  it('counts the kinds of character a random password uses', () => {
    expect(charsetSize('abc')).toBe(26);
    expect(charsetSize('aB3')).toBe(62);
    expect(charsetSize('Bx7!q')).toBe(94);
    // 94^5 / 2 = 3.67e9 guesses.
    expect(randomLog10Guesses('Bx7!q')).toBeCloseTo(9.56, 2);
  });

  it('formats crack times in words', () => {
    expect(formatDuration(0.4)).toBe('instantly');
    expect(formatDuration(1)).toBe('1 second');
    expect(formatDuration(24)).toBe('24 seconds');
    expect(formatDuration(3 * 3600)).toBe('3 hours');
    expect(formatDuration(2.1 * 86400)).toBe('2 days');
    const year = 365.25 * 86400;
    expect(formatDuration(45 * year)).toBe('45 years');
    expect(formatDuration(5_123 * year)).toBe(`${(5_100).toLocaleString()} years`);
    expect(formatDuration(2.7e6 * year)).toBe(`${(2.7).toLocaleString()} million years`);
    expect(formatDuration(59e12 * year)).toBe('59 trillion years');
  });

  it('shows the model: guesses divided by the attack speed', () => {
    expect(crackText(INSTANT)).toBe('Cracked instantly');
    expect(crackText(TEN_S)).toBe('Cracked in 10 seconds');
  });

  it('counts everything under a second as the same strength', () => {
    expect(strength(entry('a', 0))).toBe(0);
    expect(strength(entry('b', 9.9))).toBe(0);
    expect(strength(TEN_S)).toBeCloseTo(1);
  });
});

describe('pickPair', () => {
  it('shrinks the gap with the streak, down to the minimum', () => {
    expect(gapFor(0)).toBe(4);
    expect(gapFor(2)).toBe(3);
    expect(gapFor(50)).toBe(PASSWORD_CONFIG.gap.minOrders);
  });

  it('always picks two passwords at least the gap apart, never two that both crack instantly', () => {
    const rng = mulberry32(1);
    for (const gap of [4, 3, 2, 1]) {
      for (let i = 0; i < 200; i++) {
        const [a, b] = pickPair(PASSWORDS, gap, rng);
        expect(Math.abs(strength(a) - strength(b))).toBeGreaterThanOrEqual(gap);
      }
    }
  });

  it('prefers passwords not shown yet this run', () => {
    const pool = [INSTANT, entry('weak-2', 4), HOURS, DAYS];
    const seen = new Set(['weak', 'hours']);
    for (let i = 0; i < 20; i++) {
      const pair = pickPair(pool, 3, mulberry32(i), seen);
      expect(pair.map((e) => e.text).sort()).toEqual(['days', 'weak-2']);
    }
  });

  it('leaves out passwords that crack instantly once the gap is small', () => {
    const pool = [INSTANT, entry('weak-2', 4), HOURS, DAYS];
    for (let i = 0; i < 20; i++) {
      const [a, b] = pickPair(pool, PASSWORD_CONFIG.gap.noInstantFromOrders, mulberry32(i));
      expect([a.text, b.text].sort()).toEqual(['days', 'hours']);
    }
    const early = new Set<string>();
    for (let i = 0; i < 50; i++) pickPair(pool, 3, mulberry32(i)).forEach((e) => early.add(e.text));
    expect(early.has('weak') || early.has('weak-2')).toBe(true);
  });

  it('prefers a close pair when the gap is small', () => {
    // Gap 1, window 2: hours (4) vs days (6) is within the window; instant (0) vs days (6) is not.
    const pool = [INSTANT, HOURS, DAYS];
    for (let i = 0; i < 20; i++) {
      const pair = pickPair(pool, 1.5, mulberry32(i), new Set(), { ...PASSWORD_CONFIG, gap: { ...PASSWORD_CONFIG.gap, windowOrders: 2 } });
      expect(pair.map((e) => e.text).sort()).toEqual(['days', 'hours']);
    }
  });

  it('puts the stronger password on either side', () => {
    const sides = new Set<number>();
    for (let i = 0; i < 20; i++) sides.add(strongerSide(pickPair([INSTANT, DAYS], 1, mulberry32(i))));
    expect(sides).toEqual(new Set([0, 1]));
  });

  it('falls back to the widest pair when nothing is far enough apart', () => {
    const pair = pickPair([INSTANT, TEN_S, HOURS], 10, mulberry32(3));
    expect(pair.map((e) => e.text).sort()).toEqual(['hours', 'weak']);
  });
});

describe('passwordReducer: a time attack', () => {
  const pair: Pair = [INSTANT, DAYS]; // the stronger one is on the right
  const next: Pair = [HOURS, TEN_S]; // the stronger one is on the left
  const tick = (s: PasswordState, ms: number) => {
    let x = s;
    for (let t = 0; t < ms; t += 100) x = reducer(x, { type: 'TICK', ms: Math.min(100, ms - t) });
    return x;
  };

  it('the clock drains while picking, and time running out ends the game', () => {
    const start = startState(pair);
    expect(start.timeLeftMs).toBe(cfg.clock.startMs);
    expect(tick(start, 5_000).timeLeftMs).toBe(cfg.clock.startMs - 5_000);
    const over = tick(start, cfg.clock.startMs);
    expect(over.phase).toBe('over');
    expect(over.timeLeftMs).toBe(0);
  });

  it('a right pick scores and adds time; a wrong one takes time away', () => {
    const right = reducer(startState(pair), { type: 'PICK', side: 1 });
    expect(right.phase).toBe('revealed');
    expect(right.score).toBe(100);
    expect(right.timeLeftMs).toBe(cfg.clock.startMs + cfg.clock.rightBonusMs);
    const wrong = reducer(startState(pair), { type: 'PICK', side: 0 });
    expect(wrong.score).toBe(0);
    expect(wrong.timeLeftMs).toBe(cfg.clock.startMs - cfg.clock.wrongPenaltyMs);
    expect(wrong.streak).toBe(0);
  });

  it('streaks multiply the points, and the clock never holds more than the maximum', () => {
    let s: PasswordState = { ...startState(pair), timeLeftMs: cfg.clock.maxMs - 500 };
    s = reducer(s, { type: 'PICK', side: 1 });
    expect(s.timeLeftMs).toBe(cfg.clock.maxMs);
    s = reducer(reducer(s, { type: 'NEXT', pair }), { type: 'PICK', side: 1 });
    expect(s.score).toBe(210);
    expect(s.history[1].multiplier).toBeCloseTo(1.1);
  });

  it('the clock waits while the crack times show', () => {
    const revealed = reducer(startState(pair), { type: 'PICK', side: 1 });
    expect(tick(revealed, 3_000)).toBe(revealed);
  });

  it('a wrong pick that empties the clock still shows its reveal, then ends', () => {
    const last = reducer({ ...startState(pair), timeLeftMs: 1_000 }, { type: 'PICK', side: 0 });
    expect(last.phase).toBe('revealed');
    expect(last.timeLeftMs).toBe(0);
    expect(reducer(last, { type: 'NEXT', pair: next }).phase).toBe('over');
  });

  it('shows the next pair after the reveal, and ignores out-of-turn actions', () => {
    const revealed = reducer(startState(pair), { type: 'PICK', side: 1 });
    expect(reducer(revealed, { type: 'PICK', side: 0 })).toBe(revealed);
    const picking = startState(pair);
    expect(reducer(picking, { type: 'NEXT', pair: next })).toBe(picking);
    const moved = reducer(revealed, { type: 'NEXT', pair: next });
    expect(moved.phase).toBe('picking');
    expect(moved.pair).toBe(next);
    expect(strongerSide(moved.pair)).toBe(0);
  });
});
