import { describe, expect, it } from 'vitest';
import {
  addScore,
  bestFor,
  boardKey,
  boardsOf,
  parseLeaderboards,
  rankFor,
  toCsv,
  type ScoreEntry,
} from './leaderboard';
import type { GameModule } from './types';

const entry = (initials: string, score: number): ScoreEntry => ({ initials, score, date: '2026-10-27T10:00:00.000Z' });
const board = [entry('AAA', 500), entry('BBB', 300), entry('CCC', 100)];

// Only the fields the leaderboard reads.
const game = (id: GameModule['id'], title: string, boards?: GameModule['boards']) =>
  ({ id, title, boards }) as GameModule;
const phish = game('phish', 'Phish or Safe', [
  { id: 'beginner', label: 'Beginner' },
  { id: 'experienced', label: 'Experienced' },
]);
const claw = game('claw', 'Claw Machine');

describe('rankFor', () => {
  it('places a score by how many scores beat or tie it', () => {
    expect(rankFor(board, 600, 10)).toBe(1);
    expect(rankFor(board, 400, 10)).toBe(2);
    expect(rankFor(board, 50, 10)).toBe(4);
  });

  it('puts a tie below the existing score', () => {
    expect(rankFor(board, 300, 10)).toBe(3);
  });

  it('rejects scores that miss a full board', () => {
    expect(rankFor(board, 100, 3)).toBeNull();
    expect(rankFor(board, 101, 3)).toBe(3);
  });

  it('never ranks a zero score', () => {
    expect(rankFor([], 0, 10)).toBeNull();
  });
});

describe('addScore', () => {
  it('inserts in order and reports the rank', () => {
    const { board: next, rank } = addScore(board, entry('NEW', 400), 10);
    expect(rank).toBe(2);
    expect(next.map((e) => e.initials)).toEqual(['AAA', 'NEW', 'BBB', 'CCC']);
  });

  it('drops the lowest score off a full board', () => {
    const { board: next } = addScore(board, entry('NEW', 400), 3);
    expect(next.map((e) => e.initials)).toEqual(['AAA', 'NEW', 'BBB']);
  });

  it('leaves the board alone when the score misses', () => {
    const { board: next, rank } = addScore(board, entry('NEW', 10), 3);
    expect(rank).toBeNull();
    expect(next).toEqual(board);
  });
});

describe('boards', () => {
  it('keys a board by the game, plus the level for a game with several', () => {
    expect(boardKey('claw')).toBe('claw');
    expect(boardKey('phish', 'beginner')).toBe('phish:beginner');
    expect(boardsOf(claw)).toEqual([{ key: 'claw', label: '' }]);
    expect(boardsOf(phish)).toEqual([
      { key: 'phish:beginner', label: 'Beginner' },
      { key: 'phish:experienced', label: 'Experienced' },
    ]);
  });

  it("finds the menu's best score across a game's boards", () => {
    const boards = { 'phish:beginner': [entry('BEG', 300)], 'phish:experienced': [entry('EXP', 900)], claw: [] };
    expect(bestFor(boards, phish)).toEqual(entry('EXP', 900));
    expect(bestFor(boards, claw)).toBeNull();
    expect(bestFor({}, claw)).toBeNull();
  });
});

describe('parseLeaderboards', () => {
  it('gives no boards for missing or junk data', () => {
    expect(parseLeaderboards(null)).toEqual({});
    expect(parseLeaderboards('nonsense')).toEqual({});
    expect(parseLeaderboards([entry('AAA', 1)])).toEqual({});
  });

  it('keeps valid entries, drops broken ones, and sorts and trims', () => {
    const raw = {
      'phish:beginner': [entry('LOW', 1), { initials: 'BAD' }, entry('TOP', 9), entry('MID', 5)],
      claw: 'oops',
    };
    const boards = parseLeaderboards(raw, 2);
    expect(boards['phish:beginner'].map((e) => e.initials)).toEqual(['TOP', 'MID']);
    expect(boards.claw).toBeUndefined();
  });
});

describe('toCsv', () => {
  it('lists every score with its game, level and rank', () => {
    const boards = { 'phish:experienced': [entry('AAA', 500), entry('BBB', 300)], claw: [entry('C,D', 40)] };
    expect(toCsv(boards, [phish, claw]).split('\r\n')).toEqual([
      'Game,Level,Rank,Initials,Score,Date',
      'Phish or Safe,Experienced,1,AAA,500,2026-10-27T10:00:00.000Z',
      'Phish or Safe,Experienced,2,BBB,300,2026-10-27T10:00:00.000Z',
      'Claw Machine,,1,"C,D",40,2026-10-27T10:00:00.000Z',
      '',
    ]);
  });

  it("leaves out boards for games that aren't in this build", () => {
    expect(toCsv({ claw: [entry('AAA', 1)] }, [phish])).toBe('Game,Level,Rank,Initials,Score,Date\r\n');
  });
});
