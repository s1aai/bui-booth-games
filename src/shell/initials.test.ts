import { describe, expect, it } from 'vitest';
import { BLOCKED_INITIALS, cleanInitials, isBlocked, isComplete } from './initials';

describe('cleanInitials', () => {
  it('keeps up to three letters, in capitals', () => {
    expect(cleanInitials('jax')).toBe('JAX');
    expect(cleanInitials('j.a 4x!')).toBe('JAX');
    expect(cleanInitials('abcd')).toBe('ABC');
    expect(cleanInitials('é1')).toBe('');
  });

  it('is complete at three letters', () => {
    expect(isComplete('JA')).toBe(false);
    expect(isComplete('JAX')).toBe(true);
  });
});

describe('isBlocked', () => {
  it('blocks every listed word, in any case', () => {
    for (const word of BLOCKED_INITIALS) expect(isBlocked(word)).toBe(true);
    expect(isBlocked('ass')).toBe(true);
  });

  it('allows ordinary initials', () => {
    expect(isBlocked('JAX')).toBe(false);
  });

  it('only lists three capital letters', () => {
    for (const word of BLOCKED_INITIALS) expect(word).toMatch(/^[A-Z]{3}$/);
  });
});
