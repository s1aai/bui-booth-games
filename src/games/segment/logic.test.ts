import { describe, expect, it } from 'vitest';
import { SEGMENT_CONFIG, type SegmentConfig } from './config';
import { LINK_KINDS, type LinkKind } from './data';
import {
  createSegmentReducer,
  initialSegmentState,
  isAdjacent,
  isSolved,
  makePuzzle,
  roundFor,
  type Cell,
  type SegmentAction,
  type SegmentState,
} from './logic';
import { validateSegment } from './validate';

const cfg: SegmentConfig = SEGMENT_CONFIG;
const reducer = createSegmentReducer(cfg);
const run = (s: SegmentState, ...actions: SegmentAction[]) => actions.reduce(reducer, s);

/** Draws one link along a path of squares, as a finger would. */
function drawPath(s: SegmentState, path: readonly Cell[]): SegmentState {
  let x = reducer(s, { type: 'START_DRAW', cell: path[0] });
  for (const cell of path.slice(1)) x = reducer(x, { type: 'DRAW', cell });
  return reducer(x, { type: 'END_DRAW' });
}

/** Draws every link of the current puzzle's own solution. */
const solve = (s: SegmentState) => s.puzzle.solution.reduce(drawPath, s);

describe('makePuzzle', () => {
  it('always makes a solvable puzzle: its solution uses every square once, in unbroken lines between the ends', () => {
    for (const round of cfg.rounds) {
      for (let seed = 0; seed < 300; seed++) {
        const { size, links, solution } = makePuzzle(round, seed);
        expect(links).toHaveLength(round.links);
        const used = solution.flat();
        expect(new Set(used).size).toBe(size * size);
        expect(used).toHaveLength(size * size);
        solution.forEach((path, i) => {
          expect(path.length).toBeGreaterThanOrEqual(cfg.minLinkLength);
          expect([path[0], path[path.length - 1]]).toEqual(links[i].ends);
          for (let j = 1; j < path.length; j++) expect(isAdjacent(path[j - 1], path[j], size)).toBe(true);
        });
        expect(new Set(links.map((l) => l.kind)).size).toBe(links.length);
      }
    }
  });

  it("rarely puts a link's two ends side by side (they'd connect trivially)", () => {
    let adjacent = 0;
    for (let seed = 0; seed < 300; seed++) {
      const { size, links } = makePuzzle(roundFor(0), seed);
      adjacent += links.filter((l) => isAdjacent(l.ends[0], l.ends[1], size)).length;
    }
    expect(adjacent).toBe(0);
  });

  it('is deterministic, and different seeds make different puzzles', () => {
    expect(makePuzzle(roundFor(0), 5)).toEqual(makePuzzle(roundFor(0), 5));
    expect(makePuzzle(roundFor(0), 5)).not.toEqual(makePuzzle(roundFor(0), 6));
  });
});

/**
 * A tiny puzzle to draw on by hand. Squares:  0 1 2   Link A joins 0 and 2; link B joins 6 and 8.
 *                                             3 4 5
 *                                             6 7 8
 */
const tiny = (ends: [[Cell, Cell], [Cell, Cell]]): SegmentState => ({
  ...initialSegmentState(1),
  puzzle: { size: 3, links: [{ kind: 0, ends: ends[0] }, { kind: 1, ends: ends[1] }], solution: [] },
  paths: [[], []],
  kindsSeen: [0, 1],
});
const T = tiny([[0, 2], [6, 8]]);
const moves = (...cells: Cell[]): SegmentAction[] => cells.map((cell) => ({ type: 'DRAW', cell }));

describe('drawing', () => {
  it('a line follows the finger from an end, square by square, and connects at the other end', () => {
    const s = drawPath(T, [0, 1, 2]);
    expect(s.paths[0]).toEqual([0, 1, 2]);
    expect(s.drawing).toBeNull();
  });

  it('a finger that jumps ahead is followed square by square, and stops before another link\'s end', () => {
    // From 0 straight to 8 (B's end): down, right, down, then 8 is blocked.
    const s = run(T, { type: 'START_DRAW', cell: 0 }, { type: 'DRAW', cell: 8 });
    expect(s.paths[0]).toEqual([0, 3, 4, 7]);
  });

  it('a quick move that skips a corner goes round the side that cuts no other line', () => {
    // B runs 6-3; A jumps from 0 to 4 in one move. Down first would cut B at 3, so it goes 0-1-4.
    let s = run(tiny([[0, 8], [6, 2]]), { type: 'START_DRAW', cell: 6 }, ...moves(3), { type: 'END_DRAW' });
    s = run(s, { type: 'START_DRAW', cell: 0 }, ...moves(4));
    expect(s.paths[0]).toEqual([0, 1, 4]);
    expect(s.paths[1]).toEqual([6, 3]);
  });

  it("never enters another link's end", () => {
    const s = run(T, { type: 'START_DRAW', cell: 0 }, ...moves(3, 6));
    expect(s.paths[0]).toEqual([0, 3]);
  });

  it('going back along the line shortens it; touching an end starts that line again', () => {
    let s = run(T, { type: 'START_DRAW', cell: 0 }, ...moves(3, 4, 1));
    s = reducer(s, { type: 'DRAW', cell: 3 });
    expect(s.paths[0]).toEqual([0, 3]);
    s = run(s, { type: 'END_DRAW' }, { type: 'START_DRAW', cell: 2 });
    expect(s.paths[0]).toEqual([2]);
  });

  it('picking up a line part-way carries on from there', () => {
    let s = run(T, { type: 'START_DRAW', cell: 0 }, ...moves(3, 4), { type: 'END_DRAW' });
    s = run(s, { type: 'START_DRAW', cell: 3 }, ...moves(4, 1, 2));
    expect(s.paths[0]).toEqual([0, 3, 4, 1, 2]);
  });

  it('a connected line goes no further', () => {
    const s = run(T, { type: 'START_DRAW', cell: 0 }, ...moves(1, 2, 5));
    expect(s.paths[0]).toEqual([0, 1, 2]);
  });

  it('drawing across another line cuts that line back; lines never overlap', () => {
    let s = drawPath(T, [6, 7, 8]);
    s = run(s, { type: 'START_DRAW', cell: 0 }, ...moves(3, 4, 7));
    expect(s.paths[0]).toEqual([0, 3, 4, 7]);
    expect(s.paths[1]).toEqual([6]);
  });

  it('is only solved when every link is connected and every square used', () => {
    // A and B joined 0-2 and 6-5: connected along the edges, 3 and 4 are left empty.
    const U = tiny([[0, 2], [6, 5]]);
    let s = drawPath(drawPath(U, [0, 1, 2]), [6, 7, 8, 5]);
    expect(s.paths.flat()).toHaveLength(7);
    expect(isSolved(s)).toBe(false);
    expect(s.solvedAtMs).toBeNull();
    // Rerouting A through the middle uses every square.
    s = drawPath(s, [0, 3, 4, 1, 2]);
    expect(isSolved(s)).toBe(true);
    expect(s.solvedAtMs).not.toBeNull();
    expect(s.score).toBe(roundFor(0).points);
  });
});

describe('solving and the round', () => {
  it('drawing every link along its solution solves it: points, then the next, bigger puzzle after a pause', () => {
    let s = solve(initialSegmentState(9));
    expect(isSolved(s)).toBe(true);
    expect(s.score).toBe(roundFor(0).points);
    expect(s.solved).toBe(1);
    expect(s.solvedAtMs).not.toBeNull();
    // Ignores drawing while the solved puzzle shows, and the clock waits.
    expect(reducer(s, { type: 'START_DRAW', cell: 0 })).toBe(s);
    const left = s.timeLeftMs;
    for (let t = 0; t < cfg.solvedPauseMs; t += 50) s = reducer(s, { type: 'TICK', ms: 50 });
    expect(s.timeLeftMs).toBe(left);
    expect(s.round).toBe(1);
    expect(s.solvedAtMs).toBeNull();
    expect(s.paths.every((p) => p.length === 0)).toBe(true);
    // Solve on through every round: they grow, then the last repeats.
    for (let r = 1; r < cfg.rounds.length + 2; r++) {
      expect(s.puzzle.size).toBe(roundFor(r).size);
      s = solve(s);
      for (let t = 0; t < cfg.solvedPauseMs; t += 50) s = reducer(s, { type: 'TICK', ms: 50 });
    }
    expect(s.largest).toBe(Math.max(...cfg.rounds.map((r) => r.size)));
  });

  it('remembers the kinds of link seen and connected, for the lessons', () => {
    let s = initialSegmentState(9);
    expect(s.kindsSeen).toHaveLength(roundFor(0).links);
    expect(s.kindsDone).toHaveLength(0);
    s = solve(s);
    expect([...s.kindsDone].sort()).toEqual([...s.kindsSeen].sort());
  });

  it('the clock runs down while playing, and the game ends at zero, ignoring everything after', () => {
    let s = initialSegmentState(1);
    for (let t = 0; t <= cfg.roundMs; t += 100) s = reducer(s, { type: 'TICK', ms: 100 });
    expect(s.over).toBe(true);
    expect(s.timeLeftMs).toBe(0);
    expect(reducer(s, { type: 'START_DRAW', cell: s.puzzle.links[0].ends[0] })).toBe(s);
  });

  it('caps a long tick, so a stalled screen can not skip ahead', () => {
    const s = reducer(initialSegmentState(1), { type: 'TICK', ms: 60_000 });
    expect(s.timeLeftMs).toBe(cfg.roundMs - cfg.maxTickMs);
  });

  it('is deterministic: the same seed and moves replay the same game', () => {
    const play = () => {
      let s = solve(initialSegmentState(42));
      for (let t = 0; t < 2_000; t += 50) s = reducer(s, { type: 'TICK', ms: 50 });
      return drawPath(s, s.puzzle.solution[0]);
    };
    expect(play()).toEqual(play());
  });
});

describe('content', () => {
  it('passes the startup validator, which catches duplicates and impossible rounds', () => {
    expect(validateSegment(LINK_KINDS)).toEqual([]);
    const dup: LinkKind = { ...LINK_KINDS[0] };
    const tooMany = { ...cfg, rounds: [{ size: 3, links: 4, points: 1 }] };
    expect(validateSegment([dup, dup], tooMany).join('\n')).toMatch(/listed twice[\s\S]*only 2 kinds[\s\S]*can't fit/);
  });
});
