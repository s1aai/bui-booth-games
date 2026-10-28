import { describe, expect, it } from 'vitest';
import { goalFor, crackLog, fmtCrack, GOALS, YEAR } from './strength';

describe('crackLog', () => {
  it('is minus infinity for no characters', () => {
    expect(crackLog([])).toBe(-Infinity);
  });

  it('is length times the log of the pool, less the 10 billion guesses a second', () => {
    expect(crackLog([{ type: 'lower' }])).toBeCloseTo(Math.log10(26) - 10);
    // Lower and digit: pool 26 + 10 = 36.
    expect(crackLog([{ type: 'lower' }, { type: 'digit' }])).toBeCloseTo(2 * Math.log10(36) - 10);
  });

  it('counts each kind once in the pool, however many characters of it there are', () => {
    const one = crackLog([{ type: 'upper' }, { type: 'upper' }]);
    expect(one).toBeCloseTo(2 * Math.log10(26) - 10);
  });
});

describe('fmtCrack', () => {
  it('says less than a second for nothing, and seconds for short times', () => {
    expect(fmtCrack(-Infinity)).toBe('less than a second');
    expect(fmtCrack(2)).toBe('2 minutes');
    expect(fmtCrack(Math.log10(1))).toBe('1 second');
  });

  it('uses the biggest unit that fits', () => {
    expect(fmtCrack(Math.log10(3600 * 5))).toBe('5 hours');
    expect(fmtCrack(Math.log10(YEAR * 3))).toBe('3 years');
    expect(fmtCrack(Math.log10(YEAR * 2e6))).toBe('2 million years');
  });

  it('calls anything past the age of the universe that', () => {
    expect(fmtCrack(Math.log10(YEAR * 1e12))).toBe('older than the universe');
  });
});

describe('goalFor', () => {
  it('starts at a day and goes up a goal each level, then stays on the last', () => {
    expect(goalFor(1).label).toBe('1 day');
    expect(goalFor(2).label).toBe('1 year');
    expect(goalFor(99)).toBe(GOALS[GOALS.length - 1]);
  });
});
