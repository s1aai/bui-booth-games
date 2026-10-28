import { describe, expect, it } from 'vitest';
import { PHISH_CONFIG, TIER_IDS, type TierConfig } from './config';
import { EMAILS } from './data';
import type { Difficulty, Email } from './schema';
import { buildDeck, extendDeck } from './pool';
import { mulberry32 } from '../../shell/rng';

const EVEN: TierConfig['poolWeights'] = { 1: 1, 2: 1, 3: 1 };

function email(id: number, difficulty: Difficulty): Email {
  return {
    id,
    isPhish: true,
    difficulty,
    category: 'credential-harvest',
    from: { name: 'Test Sender', address: 'test@example.com' },
    subject: `Email ${id}`,
    body: 'Body',
    links: [],
    tells: [{ type: 'urgency', text: 'Tell', target: 'body' }],
  };
}

// 20 emails of each difficulty.
const POOL = [1, 2, 3].flatMap((d) => Array.from({ length: 20 }, (_, i) => email(d * 100 + i, d as Difficulty)));

describe('buildDeck', () => {
  it('never repeats an email within a run', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const ids = buildDeck(POOL, EVEN, 25, mulberry32(seed)).map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('deals at most maxEmails', () => {
    expect(buildDeck(POOL, EVEN, 25, mulberry32(1))).toHaveLength(25);
  });

  it('deals every email when the pool is smaller than the cap', () => {
    const ids = buildDeck(EMAILS, EVEN, 1000, mulberry32(3)).map((e) => e.id);
    expect(ids.sort((a, b) => a - b)).toEqual(EMAILS.map((e) => e.id).sort((a, b) => a - b));
  });

  it('is deterministic for a given seed and shuffles', () => {
    const a = buildDeck(POOL, EVEN, 60, mulberry32(42));
    expect(a).toEqual(buildDeck(POOL, EVEN, 60, mulberry32(42)));
    expect(a).not.toEqual(POOL);
  });

  it('never deals a difficulty weighted 0', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const deck = buildDeck(POOL, { 1: 3, 2: 1, 3: 0 }, 60, mulberry32(seed));
      expect(deck).toHaveLength(40);
      expect(deck.every((e) => e.difficulty !== 3)).toBe(true);
    }
  });

  it('favours difficulties with more weight', () => {
    // With weights 3:1 and equal counts, the first card is difficulty 1 three times in four.
    const runs = 2000;
    let firstIsEasy = 0;
    for (let seed = 1; seed <= runs; seed++) {
      if (buildDeck(POOL, { 1: 3, 2: 1, 3: 0 }, 25, mulberry32(seed))[0].difficulty === 1) firstIsEasy++;
    }
    expect(firstIsEasy / runs).toBeGreaterThan(0.7);
    expect(firstIsEasy / runs).toBeLessThan(0.8);
  });

  it('has enough emails for every tier in the config to fill a full run', () => {
    // (Overtime then extends the deck with extendDeck.)
    for (const id of TIER_IDS) {
      expect(buildDeck(EMAILS, PHISH_CONFIG.tiers[id].poolWeights, PHISH_CONFIG.runCap.maxEmails)).toHaveLength(
        PHISH_CONFIG.runCap.maxEmails,
      );
    }
  });
});

describe('extendDeck', () => {
  it('fills the deck to the total, dealing every unseen email before any repeat', () => {
    const first = buildDeck(POOL, EVEN, 25, mulberry32(1));
    const deck = extendDeck(first, POOL, EVEN, 200, mulberry32(2));
    expect(deck).toHaveLength(200);
    expect(deck.slice(0, 25)).toEqual(first);
    expect(new Set(deck.slice(0, 60).map((e) => e.id)).size).toBe(60);
  });

  it('never deals the same email twice in a row', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const deck = extendDeck(buildDeck(POOL, EVEN, 25, mulberry32(seed)), POOL, EVEN, 300, mulberry32(seed + 1));
      for (let i = 1; i < deck.length; i++) expect(deck[i].id).not.toBe(deck[i - 1].id);
    }
  });

  it("keeps to the tier's weights", () => {
    const easy = { 1: 3, 2: 1, 3: 0 } as const;
    const deck = extendDeck(buildDeck(POOL, easy, 25, mulberry32(1)), POOL, easy, 200, mulberry32(2));
    expect(deck.every((e) => e.difficulty !== 3)).toBe(true);
  });

  it('stops when the tier has no emails to deal', () => {
    expect(extendDeck([], POOL, { 1: 0, 2: 0, 3: 0 }, 10)).toEqual([]);
  });
});
