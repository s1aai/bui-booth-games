import { describe, expect, it } from 'vitest';
import raw from './emails.json';
import { EMAIL_CATEGORIES, validateEmails } from './schema';

describe('emails.json', () => {
  it('passes validation', () => {
    expect(validateEmails(raw)).toEqual([]);
  });

  it('has both phish and legit emails', () => {
    expect(raw.some((e) => e.isPhish)).toBe(true);
    expect(raw.some((e) => !e.isPhish)).toBe(true);
  });

  it('has the full set: 40+ emails, roughly 55% phish', () => {
    expect(raw.length).toBeGreaterThanOrEqual(40);
    const phishShare = raw.filter((e) => e.isPhish).length / raw.length;
    expect(phishShare).toBeGreaterThan(0.5);
    expect(phishShare).toBeLessThan(0.6);
  });

  it('mixes phish and legit at every difficulty, so flagging everything never wins', () => {
    for (const d of [1, 2, 3]) {
      const level = raw.filter((e) => e.difficulty === d);
      expect(level.filter((e) => e.isPhish).length).toBeGreaterThanOrEqual(5);
      expect(level.filter((e) => !e.isPhish).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('covers every category', () => {
    for (const category of EMAIL_CATEGORIES) {
      expect(raw.some((e) => e.category === category)).toBe(true);
    }
  });
});

describe('validateEmails', () => {
  const [first] = raw;

  it('rejects a file that is not a list', () => {
    expect(validateEmails({})).toHaveLength(1);
  });

  it('reports duplicate ids', () => {
    const problems = validateEmails([first, { ...first }]);
    expect(problems.some((p) => p.includes('already used'))).toBe(true);
  });

  it('reports a "match" phrase that is not in its target', () => {
    const bad = { ...first, tells: [{ type: 'urgency', text: 'Rushed', target: 'body', match: 'nowhere in this email' }] };
    expect(validateEmails([bad]).some((p) => p.includes('does not appear'))).toBe(true);
  });

  it('reports bodies that are too long for the card', () => {
    const bad = { ...first, body: Array(61).fill('word').join(' ') };
    expect(validateEmails([bad]).some((p) => p.includes('61 words'))).toBe(true);
  });

  it('reports unknown tell types and targets', () => {
    const bad = { ...first, tells: [{ type: 'bad-vibes', text: 'Hmm', target: 'footer' }] };
    const problems = validateEmails([bad]);
    expect(problems.some((p) => p.includes('not a known tell type'))).toBe(true);
    expect(problems.some((p) => p.includes('"target" must be one of'))).toBe(true);
  });

  it('requires a phish to have at least one red flag', () => {
    const bad = { ...first, tells: [{ type: 'trusted-domain', text: 'Looks fine', target: 'from' }] };
    expect(validateEmails([bad]).some((p) => p.includes('red-flag'))).toBe(true);
  });
});
