import zxcvbn from 'zxcvbn';
import { describe, expect, it } from 'vitest';
import { PASSWORDS, type PasswordEntry } from './data';
import { crackText, strength } from './logic';
import { validatePasswords } from './validate';

describe('passwords', () => {
  it('pass the startup validator', () => {
    expect(validatePasswords(PASSWORDS)).toEqual([]);
  });

  // The authoring check from the design plan: zxcvbn isn't in the game, but every common and pattern password's
  // guess count must be zxcvbn's.
  it.each(PASSWORDS.filter((p) => p.kind === 'common' || p.kind === 'pattern').map((p) => [p.text, p] as const))(
    '%s matches zxcvbn',
    (_, entry) => {
      expect(entry.log10Guesses).toBeCloseTo(zxcvbn(entry.text).guesses_log10, 2);
    },
  );

  it('any two passwords the game can pair show different crack times', () => {
    for (const a of PASSWORDS) {
      for (const b of PASSWORDS) {
        if (a !== b && Math.abs(strength(a) - strength(b)) >= 1) expect(crackText(a)).not.toBe(crackText(b));
      }
    }
  });

  it('has passwords of every kind, with plenty that crack instantly and plenty that last', () => {
    for (const kind of ['common', 'pattern', 'random', 'passphrase']) {
      expect(PASSWORDS.filter((p) => p.kind === kind).length).toBeGreaterThanOrEqual(4);
    }
    expect(PASSWORDS.filter((p) => strength(p) === 0).length).toBeGreaterThanOrEqual(10);
    expect(PASSWORDS.filter((p) => strength(p) > 0).length).toBeGreaterThanOrEqual(10);
  });
});

describe('validatePasswords', () => {
  const ok: PasswordEntry = { text: 'Bx7!q', kind: 'random', log10Guesses: 9.56, why: 'Short.' };
  const far: PasswordEntry = { text: 'Z#L#pq>FXkzf9[iC', kind: 'random', log10Guesses: 31.27, why: 'Long.' };

  it('accepts good entries', () => {
    expect(validatePasswords([ok, far])).toEqual([]);
  });

  it('catches a random password whose guess count is off', () => {
    expect(validatePasswords([{ ...ok, log10Guesses: 12 }, far]).join()).toMatch(/should be 9.56/);
  });

  it('catches a passphrase that is not lowercase words, or is miscounted', () => {
    const phrase: PasswordEntry = { text: 'Purple Otter', kind: 'passphrase', log10Guesses: 7.48, why: 'Two words.' };
    expect(validatePasswords([phrase, ok, far]).join()).toMatch(/spaces/);
    expect(validatePasswords([{ ...phrase, text: 'purple-otter', log10Guesses: 9 }, ok, far]).join()).toMatch(/should be 7.48/);
  });

  it('catches duplicates and a missing why', () => {
    const problems = validatePasswords([ok, { ...ok, why: '' }, far]).join();
    expect(problems).toMatch(/listed twice/);
    expect(problems).toMatch(/why/);
  });

  it('catches a set with too little spread to start a game', () => {
    expect(validatePasswords([ok, { ...ok, text: 'Cx7!q' }]).join()).toMatch(/span/);
  });
});
