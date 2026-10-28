import { describe, expect, it } from 'vitest';
import { PYTHON_PW_CONFIG as cfg } from './config';
import {
  DIRS,
  boardFor,
  createRun,
  hudHeight,
  hudScale,
  mistakeCounts,
  pyReducer,
  speedOf,
  type Action,
  type Board,
  type DirName,
  type PyState,
} from './logic';

const TICK = 50;

/** A run already moving, with the given parts changed. */
function playing(over: Partial<PyState> = {}): PyState {
  return { ...createRun(3), mode: 'play', ...over };
}

/** Sends one action. */
const act = (state: PyState, action: Action) => pyReducer(state, action);

/** Ticks the clock in game-sized steps for `ms` of real time. */
function ticks(state: PyState, ms: number): PyState {
  let s = state;
  for (let t = 0; t < ms; t += TICK) s = act(s, { type: 'tick', ms: TICK });
  return s;
}

/** Ticks until `done` is true, up to a limit, so a test doesn't depend on the exact step. */
function until(state: PyState, done: (s: PyState) => boolean, limit = 80): PyState {
  let s = state;
  for (let i = 0; i < limit && !done(s); i++) s = act(s, { type: 'tick', ms: TICK });
  return s;
}

/** A password of every kind, `n` long, laid out as a straight line of segments going left from the head. */
const fullPassword = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ ch: 'a', type: (['lower', 'upper', 'digit', 'symbol'] as const)[i % 4] }));

describe('a new run', () => {
  it('starts ready, at no time and no goals, with the snake one segment long and no password', () => {
    const s = createRun(1);
    expect(s.mode).toBe('ready');
    expect(s.time).toBe(0);
    expect(s.goals).toBe(0);
    expect(s.lives).toBe(cfg.lives);
    expect(s.snake).toHaveLength(1);
    expect(s.chars).toHaveLength(0);
  });

  it('gets to play after the get-ready count', () => {
    expect(act(createRun(1), { type: 'tick', ms: 1000 }).mode).toBe('ready');
    expect(ticks(createRun(1), cfg.readySeconds * 1000 + 100).mode).toBe('play');
  });
});

describe('turning', () => {
  it('refuses to turn straight back into the password once it has characters', () => {
    const s = playing({ chars: fullPassword(1) });
    expect(act(s, { type: 'turn', dir: 'down' })).toBe(s);
  });

  it('queues up to three turns and ignores more', () => {
    let s = playing();
    for (const dir of ['left', 'right', 'left', 'right'] as const) s = act(s, { type: 'turn', dir });
    expect(s.queue).toHaveLength(3);
  });

  it('ignores turns while paused or on the tip screen', () => {
    const paused = { ...playing(), mode: 'pause' as const };
    expect(act(paused, { type: 'turn', dir: 'left' })).toBe(paused);
  });
});

describe('eating and crashing', () => {
  it('eating a character grows the password and scores', () => {
    const s = playing({ tiles: [{ x: 9, y: 16, ch: 'a', type: 'lower', ph: 0 }] });
    const next = until(s, (st) => st.chars.length === 1);
    expect(next.chars).toEqual([{ ch: 'a', type: 'lower' }]);
    expect(next.snake).toHaveLength(2);
    expect(next.score).toBe(cfg.eatPoints);
    expect(next.stats.eaten).toBe(1);
  });

  it('hitting the firewall costs a life and starts the password again', () => {
    const s = playing({ snake: [{ x: 9, y: 0 }] });
    const next = until(s, (st) => st.lives < cfg.lives);
    expect(next.lives).toBe(cfg.lives - 1);
    expect(next.snake).toHaveLength(1);
    expect(next.mode).toBe('ready');
  });

  it('the last life ends the run', () => {
    const s = playing({ snake: [{ x: 9, y: 0 }], lives: 1 });
    expect(until(s, (st) => st.mode === 'over').mode).toBe('over');
  });
});

describe('weak words', () => {
  it('eating one costs a life and is a mistake to learn from', () => {
    const s = playing({ weak: [{ x: 9, y: 16, word: '123456', ttl: 7 }] });
    const next = until(s, (st) => st.lives < cfg.lives);
    expect(next.lives).toBe(cfg.lives - 1);
    expect(next.mistakes).toEqual(['weak']);
  });

  it('chops the password in half', () => {
    const s = playing({ chars: fullPassword(6), snake: [{ x: 9, y: 17 }, ...Array.from({ length: 6 }, (_, i) => ({ x: 9 - (i + 1), y: 17 }))], dir: DIRS.right, weak: [{ x: 10, y: 17, word: 'admin', ttl: 7 }] });
    const next = until(s, (st) => st.chars.length < 6);
    expect(next.chars.length).toBeLessThan(6);
    expect(next.snake).toHaveLength(next.chars.length + 1);
  });
});

describe('guess-bots', () => {
  it('the shield zaps a bot that reaches the head, for points', () => {
    const bot = { x: 9, y: 16, prev: { x: 9, y: 16 }, dir: DIRS.left, acc: 0, stun: 0, id: 0, speed: 0, chaser: false };
    const s = playing({ shieldT: 5, bots: [bot] });
    const next = until(s, (st) => st.stats.botsBlocked > 0);
    expect(next.score).toBe(cfg.botZapPoints);
    expect(next.lives).toBe(cfg.lives);
  });

  it('a bot on the head costs a life and is a mistake', () => {
    const bot = { x: 9, y: 16, prev: { x: 9, y: 16 }, dir: DIRS.left, acc: 0, stun: 0, id: 0, speed: 0, chaser: false };
    const s = playing({ bots: [bot] });
    const next = until(s, (st) => st.lives < cfg.lives);
    expect(next.lives).toBe(cfg.lives - 1);
    expect(next.mistakes).toEqual(['bot']);
  });
});

describe('goals', () => {
  // Eight characters of all four kinds reach the first goal (1 day), so one more eaten does it.
  const almost = (over: Partial<PyState> = {}) =>
    playing({
      chars: fullPassword(7),
      snake: [{ x: 9, y: 17 }, ...Array.from({ length: 7 }, (_, i) => ({ x: 8 - i, y: 17 }))],
      dir: DIRS.right,
      tiles: [{ x: 10, y: 17, ch: 'a', type: 'lower', ph: 0 }],
      ...over,
    });

  it('reaching a goal gives a banner and a bonus, and play goes on with the password kept', () => {
    const next = until(almost(), (st) => st.chars.length === 8);
    expect(next.goals).toBe(1);
    expect(next.mode).toBe('play');
    expect(next.score).toBeGreaterThanOrEqual(cfg.goalBonus);
    expect(next.floats.map((f) => f.text)).toContain(`Crack time: 1 day reached! +${cfg.goalBonus}`);
  });

  it('gives each goal once a run', () => {
    const next = until(almost({ goals: 1 }), (st) => st.chars.length === 8);
    expect(next.goals).toBe(1);
    expect(next.score).toBeLessThan(cfg.goalBonus);
  });
});

describe('getting harder', () => {
  it('counts the time played, not the get-ready count', () => {
    expect(ticks(createRun(1), 1000).time).toBe(0);
    expect(act(playing(), { type: 'tick', ms: TICK }).time).toBeCloseTo(TICK / 1000);
  });

  it('doubles the snake speed every speedDoubleSeconds, with no top speed', () => {
    expect(speedOf(0)).toBe(cfg.startSpeed);
    expect(speedOf(cfg.speedDoubleSeconds)).toBe(cfg.startSpeed * 2);
    expect(speedOf(cfg.speedDoubleSeconds * 4)).toBe(cfg.startSpeed * 16);
  });

  it('adds a bot every botEverySeconds, stunned in a corner, up to the most', () => {
    expect(playing().bots).toHaveLength(1);
    const two = act(playing({ time: cfg.botEverySeconds }), { type: 'tick', ms: TICK });
    expect(two.bots).toHaveLength(2);
    expect(two.bots[1].stun).toBeGreaterThan(0);
    expect([0, cfg.cols - 1]).toContain(two.bots[1].x);
    expect([0, cfg.rows - 1]).toContain(two.bots[1].y);
    expect(act(playing({ time: cfg.botEverySeconds * 20 }), { type: 'tick', ms: TICK }).bots).toHaveLength(cfg.maxBots);
  });

  it('turns the first bot into a chaser at chaserFromSeconds', () => {
    expect(act(playing(), { type: 'tick', ms: TICK }).bots[0].chaser).toBe(false);
    expect(act(playing({ time: cfg.chaserFromSeconds }), { type: 'tick', ms: TICK }).bots[0].chaser).toBe(true);
  });

  it('a bot that crosses several cells in one tick still catches the head on the way', () => {
    // One row, so the bot can only go right: ten cells this tick, through the head at column 6.
    const bot = { x: 0, y: 0, prev: { x: 0, y: 0 }, dir: DIRS.right, acc: 0, stun: 0, id: 0, speed: 200, chaser: false };
    const s = playing({ cols: 12, rows: 1, snake: [{ x: 6, y: 0 }], bots: [bot], tiles: [], weak: [], powers: [] });
    const next = act(s, { type: 'tick', ms: TICK });
    expect(next.lives).toBe(cfg.lives - 1);
    expect(next.mistakes).toEqual(['bot']);
  });

  // A careful player: never hits a wall, its own tail or a weak word, and steers away from the bots. It doesn't
  // chase characters, which only makes a run harder.
  it('ends even a careful run within five minutes, but not in under two', () => {
    const survive = (seed: number) => {
      let s = createRun(seed);
      while (s.mode !== 'over' && s.time < 600) {
        if (s.mode === 'play' && s.queue.length === 0) {
          const h = s.snake[0];
          const body = s.snake.slice(0, -1);
          const blocked = (x: number, y: number) =>
            x < 0 ||
            y < 0 ||
            x >= s.cols ||
            y >= s.rows ||
            [...body, ...s.weak].some((p) => p.x === x && p.y === y);
          let best: DirName | null = null;
          let bestScore = -Infinity;
          for (const name of Object.keys(DIRS) as DirName[]) {
            const d = DIRS[name];
            const x = h.x + d.x;
            const y = h.y + d.y;
            if ((s.chars.length > 0 && d.x === -s.dir.x && d.y === -s.dir.y) || blocked(x, y)) continue;
            const exits = Object.values(DIRS).filter((e) => !blocked(x + e.x, y + e.y)).length;
            const near = Math.min(6, ...s.bots.map((b) => Math.abs(b.x - x) + Math.abs(b.y - y)));
            const score = near * 10 + exits * 3 + (d === s.dir ? 1 : 0);
            if (score > bestScore) [best, bestScore] = [name, score];
          }
          if (best && DIRS[best] !== s.dir) s = act(s, { type: 'turn', dir: best });
        }
        s = act(s, { type: 'tick', ms: 16 });
      }
      return s.time;
    };
    for (const seed of [1, 2, 3, 4, 5]) {
      const time = survive(seed);
      expect(time).toBeGreaterThan(120);
      expect(time).toBeLessThan(300);
    }
  });
});

describe('pausing', () => {
  it('pauses from play and resumes where it was', () => {
    const paused = act(playing(), { type: 'pause' });
    expect(paused.mode).toBe('pause');
    expect(act(paused, { type: 'resume' }).mode).toBe('play');
  });

  it('a pause from the get-ready count resumes to the get-ready count', () => {
    const paused = act(createRun(1), { type: 'pause' });
    expect(act(paused, { type: 'resume' }).mode).toBe('ready');
  });

  it('does not move while paused', () => {
    const paused = { ...playing(), mode: 'pause' as const };
    expect(ticks(paused, 1000)).toBe(paused);
  });
});

describe('replay', () => {
  it('the same seed and turns make the same run', () => {
    const play = (seed: number) => {
      let s = createRun(seed);
      for (let i = 0; i < 400 && s.mode !== 'over'; i++) {
        if (i % 25 === 0) s = act(s, { type: 'turn', dir: i % 50 ? 'left' : 'up' });
        s = act(s, { type: 'tick', ms: TICK });
      }
      return s;
    };
    expect(play(42)).toEqual(play(42));
    expect(play(42).tiles).not.toEqual(play(43).tiles);
  });
});

describe('boards sized to the screen', () => {
  /** The size a board's cells are drawn at on a stage this big, as draw.ts works it out. */
  const cellOn = (w: number, h: number, b: Board) => Math.min(w / b.cols, (h - hudHeight(w)) / b.rows);

  it('fills the booth screens and a phone with about targetRows rows, within the cell size limits', () => {
    for (const [w, h] of [
      [1920, 950],
      [1536, 740],
      [1366, 640],
      [1280, 590],
      [390, 600],
    ]) {
      const b = boardFor(w, h);
      const cell = cellOn(w, h, b);
      expect(b.rows).toBeGreaterThanOrEqual(cfg.targetRows);
      expect(cell).toBeGreaterThanOrEqual(cfg.minCellPx);
      expect(cell).toBeLessThanOrEqual(cfg.maxCellPx);
      // Less than a cell left over either way, so the board fills the stage.
      expect(w - b.cols * cell).toBeLessThan(cell);
      expect(h - hudHeight(w) - b.rows * cell).toBeLessThan(cell);
    }
  });

  it('gives the booth screens the one-row HUD and a phone the stacked one', () => {
    expect(hudHeight(1280)).toBe(cfg.hudPx);
    expect(hudHeight(390)).toBe(cfg.hudNarrowPx);
  });

  it('scales the one-row HUD up on screens wider than hudScaleFromPx', () => {
    expect(hudScale(cfg.hudScaleFromPx)).toBe(1);
    expect(hudScale(1920)).toBeCloseTo(1920 / cfg.hudScaleFromPx);
    expect(hudHeight(1920)).toBe(Math.round(cfg.hudPx * hudScale(1920)));
    expect(hudScale(390)).toBe(1);
  });

  it('keeps to the column and row limits on very wide, narrow or short stages', () => {
    expect(boardFor(6000, 950).cols).toBe(cfg.maxCols);
    expect(boardFor(200, 950).cols).toBe(cfg.minCols);
    expect(boardFor(1920, 200).rows).toBe(cfg.minRows);
  });

  it('the start action begins a new run on the measured board, from where the random source was', () => {
    const board = boardFor(1920, 950);
    const run = createRun(4);
    expect(act(run, { type: 'start', board })).toEqual(createRun(run.seed, board));
  });

  it('starts everything inside the board, and nothing on top of anything else, and adds bots inside it too', () => {
    const boards: Board[] = [
      { cols: cfg.minCols, rows: cfg.minRows },
      { cols: cfg.cols, rows: cfg.rows },
      boardFor(390, 600),
      boardFor(1920, 950),
      { cols: cfg.maxCols, rows: 40 },
    ];
    const inside = (c: { x: number; y: number }, board: Board) => {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x).toBeLessThan(board.cols);
      expect(c.y).toBeLessThan(board.rows);
    };
    for (const board of boards) {
      const s = createRun(1, board);
      const cells = [...s.snake, ...s.bots, ...s.tiles, ...s.weak, ...s.powers];
      for (const c of cells) inside(c, board);
      expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(cells.length);

      const later = act({ ...s, mode: 'play', time: cfg.botEverySeconds * 20 }, { type: 'tick', ms: TICK });
      expect(later.bots.length).toBeGreaterThan(s.bots.length);
      for (const b of later.bots) {
        inside(b, board);
        expect(later.snake.some((p) => p.x === b.x && p.y === b.y)).toBe(false);
      }
    }
  });

  it('is busier on a bigger board, with more characters and guess-bots, and never quieter on a small one', () => {
    const tuned = createRun(1);
    const booth = createRun(1, boardFor(1920, 950));
    expect(booth.tiles.length).toBeGreaterThan(tuned.tiles.length);
    expect(booth.bots.length).toBeGreaterThan(tuned.bots.length);
    const small = createRun(1, { cols: cfg.minCols, rows: cfg.minRows });
    expect(small.tiles).toHaveLength(tuned.tiles.length);
    expect(small.bots).toHaveLength(tuned.bots.length);
  });

  it('puts the firewall at the edge of the board, wherever that is', () => {
    // Heading right along row 10 from column 20, past where the tuned board would end, to this one's last column.
    const board = { cols: 30, rows: 20 };
    const s = { ...createRun(1, board), mode: 'play' as const, snake: [{ x: 20, y: 10 }], dir: DIRS.right, bots: [] };
    const edge = until(s, (st) => st.snake[0].x === board.cols - 1 || st.lives < cfg.lives, 400);
    expect(edge.lives).toBe(cfg.lives);
    expect(edge.snake[0].x).toBe(board.cols - 1);
    expect(until(edge, (st) => st.lives < cfg.lives).lives).toBe(cfg.lives - 1);
  });
});

describe('mistakeCounts', () => {
  it('counts each kind once, in the order it first happened', () => {
    expect(mistakeCounts(['weak', 'bot', 'weak'])).toEqual([
      { kind: 'weak', count: 2 },
      { kind: 'bot', count: 1 },
    ]);
  });
});

describe('gliding', () => {
  it('keeps the snake cells from before its last step', () => {
    const before = [{ x: 9, y: 17 }, { x: 9, y: 18 }];
    const s = playing({ snake: before, dir: DIRS.up, moveAcc: 0.99 });
    const next = act(s, { type: 'tick', ms: 50 });
    expect(next.snake[0]).toEqual({ x: 9, y: 16 });
    expect(next.prevSnake).toEqual(before);
  });

  it('keeps a guess-bot cell from before its last step', () => {
    const bot = { x: 9, y: 16, prev: { x: 9, y: 16 }, dir: DIRS.left, acc: 0.99, stun: 0, id: 0, speed: 2, chaser: false };
    const s = playing({ bots: [bot] });
    const next = act(s, { type: 'tick', ms: 50 });
    expect(next.bots[0].prev).toEqual({ x: 9, y: 16 });
    expect(next.bots[0].x !== 9 || next.bots[0].y !== 16).toBe(true);
  });
});
