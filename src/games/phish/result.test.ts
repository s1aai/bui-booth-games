import { describe, expect, it } from 'vitest';
import { boardsOf } from '../../shell/leaderboard';
import { TIER_IDS } from './config';
import game from './index';
import { toResult } from './Play';
import { initialGameState } from './state';

describe('Phish or Safe leaderboards', () => {
  it('has one board per level, named after it', () => {
    expect(boardsOf(game)).toEqual([
      { key: 'phish:beginner', label: 'Beginner' },
      { key: 'phish:intermediate', label: 'Intermediate' },
      { key: 'phish:experienced', label: 'Experienced' },
    ]);
    expect(game.boards?.map(({ id }) => id)).toEqual([...TIER_IDS]);
  });

  it("puts a run's score on the board for the level it was played on", () => {
    for (const tier of TIER_IDS) {
      expect(toResult({ ...initialGameState, tier, screen: 'results', endReason: 'strikes' }).board).toBe(tier);
    }
  });
});
