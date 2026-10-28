import { describe, expect, it } from 'vitest';
import { BYTE_GUARD_CONFIG as cfg } from './config';
import { KINDS, threatPool, type ItemKind } from './data';
import {
  advance,
  byteGuardReducer,
  clock,
  comboOf,
  createRun,
  mistakeCounts,
  rampOf,
  worldWidth,
  type ByteGuardState,
  type Controls,
  type Item,
} from './logic';

const still: Controls = { steer: 0, pointerX: null, fire: false };
const TICK = 50;

/** A run with one item placed by hand: `at` sets where, the rest is the default. */
function withItem(kind: ItemKind, at: Partial<Item> = {}, state: ByteGuardState = createRun(7)): ByteGuardState {
  return {
    ...state,
    items: [{ id: 900, kind, x: cfg.width / 2, y: cfg.playerY, vy: 0, wob: 0, ...at }],
  };
}

describe('comboOf', () => {
  it('goes up a step for each streak run, and stops at the maximum', () => {
    expect(comboOf(0)).toBe(1);
    expect(comboOf(cfg.streakPerCombo)).toBe(2);
    expect(comboOf(1000)).toBe(cfg.maxCombo);
  });
});

describe('controls on the run', () => {
  it('pauses and resumes only from play', () => {
    const run = createRun(1);
    const paused = byteGuardReducer(run, { type: 'pause' });
    expect(paused.mode).toBe('pause');
    expect(byteGuardReducer(paused, { type: 'resume' }).mode).toBe('play');
    expect(byteGuardReducer(run, { type: 'resume' })).toBe(run);
  });

  it('does not move while paused', () => {
    const paused = { ...createRun(1), mode: 'pause' as const };
    expect(advance(paused, TICK, { steer: 1, pointerX: null, fire: false })).toBe(paused);
  });

  it('steers and keeps Guardie on screen', () => {
    let run = createRun(1);
    for (let i = 0; i < 200; i++) run = advance(run, TICK, { steer: -1, pointerX: null, fire: false });
    expect(run.playerX).toBe(cfg.playerWidth / 2);
  });
});

describe('catching and zapping', () => {
  it('catching a good file scores points with the combo', () => {
    const next = advance(withItem('email'), TICK, still);
    expect(next.score).toBe(10);
    expect(next.stats.delivered).toBe(1);
    expect(next.streak).toBe(1);
  });

  it('catching a threat is a strike and a mistake to learn from', () => {
    const next = advance(withItem('virus'), TICK, still);
    expect(next.lives).toBe(cfg.lives - 1);
    expect(next.streak).toBe(0);
    expect(next.mistakes).toEqual(['virus']);
  });

  it('zapping a threat with a bolt scores it', () => {
    const run = withItem('phish', { x: 100, y: 280 });
    const next = advance({ ...run, bolts: [{ x: 100, y: 300 }] }, TICK, still);
    expect(next.score).toBe(30);
    expect(next.stats.zapped).toBe(1);
    expect(next.stats.phishZapped).toBe(1);
    expect(next.items).toHaveLength(0);
  });

  it('zapping a good file costs the combo and is a mistake', () => {
    const run = { ...withItem('photo', { x: 100, y: 280 }), streak: 9 };
    const next = advance({ ...run, bolts: [{ x: 100, y: 300 }] }, TICK, still);
    expect(next.streak).toBe(0);
    expect(next.stats.friendsZapped).toBe(1);
    expect(next.mistakes).toEqual(['photo']);
  });

  it('a threat that reaches the server costs a heart', () => {
    const next = advance(withItem('locker', { x: 60, y: cfg.groundY + 60 }), TICK, still);
    expect(next.lives).toBe(cfg.lives - 1);
    expect(next.stats.letIn).toBe(1);
  });

  it('a good file that reaches the server only breaks the streak', () => {
    const run = { ...withItem('game', { x: 60, y: cfg.groundY + 60 }), streak: 4 };
    const next = advance(run, TICK, still);
    expect(next.lives).toBe(cfg.lives);
    expect(next.streak).toBe(0);
  });
});

describe('power-ups', () => {
  it('the shield blocks the next threat and then drops', () => {
    const run = { ...withItem('virus'), shield: true };
    const next = advance(run, TICK, still);
    expect(next.lives).toBe(cfg.lives);
    expect(next.shield).toBe(false);
    expect(next.mistakes).toHaveLength(0);
  });

  it('a backup heart adds one, up to the maximum', () => {
    const run = { ...withItem('backup'), lives: cfg.maxLives };
    expect(advance(run, TICK, still).lives).toBe(cfg.maxLives);
    expect(advance({ ...withItem('backup'), lives: 2 }, TICK, still).lives).toBe(3);
  });

  it('catching the update starts slow-mo', () => {
    const next = advance(withItem('patch'), TICK, still);
    expect(next.slowLeft).toBe(cfg.slowSeconds);
  });

  it('slow-mo runs out, and then things fall at full speed again', () => {
    const run = { ...withItem('virus', { y: 100, vy: 100 }), slowLeft: TICK / 1000 };
    const slowed = advance(run, TICK, still);
    expect(slowed.slowLeft).toBe(0);
    expect(slowed.items[0].y).toBeCloseTo(100 + 100 * (TICK / 1000) * cfg.slowFactor);
    const after = advance(slowed, TICK, still);
    expect(after.items[0].y).toBeCloseTo(slowed.items[0].y + 100 * (TICK / 1000));
  });
});

describe('runs', () => {
  it('ends when the last heart goes', () => {
    const run = { ...withItem('virus'), lives: 1 };
    expect(advance(run, TICK, still).mode).toBe('over');
  });

  it('counts the time played, shown as m:ss', () => {
    expect(advance(createRun(1), TICK, still).time).toBeCloseTo(TICK / 1000);
    expect(clock(0)).toBe('0:00');
    expect(clock(65.9)).toBe('1:05');
  });

  it('replays the same run from the same seed and inputs', () => {
    const controls: Controls = { steer: 0, pointerX: null, fire: true };
    const play = (seed: number) => {
      let run = createRun(seed);
      for (let i = 0; i < 400 && run.mode === 'play'; i++) {
        run = advance(run, TICK, { ...controls, steer: i % 40 < 20 ? 1 : -1 });
      }
      return run;
    };
    expect(play(42)).toEqual(play(42));
    expect(play(42).items).not.toEqual(play(43).items);
  });
});

describe('worlds sized to the screen', () => {
  it('is as wide as the screen is shaped, within the limits', () => {
    expect(worldWidth(cfg.width, cfg.height)).toBe(cfg.width);
    expect(worldWidth(cfg.width * 2, cfg.height * 2)).toBe(cfg.width);
    expect(worldWidth(1920, 900)).toBe(Math.round((1920 * cfg.height) / 900));
    expect(worldWidth(10000, 500)).toBe(cfg.maxWidth);
    expect(worldWidth(300, 2000)).toBe(cfg.minWidth);
  });

  it('the start action begins the same run on the measured world', () => {
    expect(byteGuardReducer(createRun(9), { type: 'start', width: 1000 })).toEqual(createRun(9, 1000));
  });

  it('starts Guardie in the middle of a wide world and lets it reach the far side', () => {
    let s = createRun(1, 1200);
    expect(s.playerX).toBe(600);
    for (let i = 0; i < 40; i++) s = advance(s, TICK, { ...still, steer: 1 });
    expect(s.playerX).toBe(1200 - cfg.playerWidth / 2);
  });

  it('drops items across the whole width, and more of them on a wider world', () => {
    // Five seconds: long enough for several items, too short for any to reach Guardie's line.
    const drops = (width: number) => {
      let s = createRun(5, width);
      const seen = new Map<number, number>();
      for (let t = 0; t < 5000; t += TICK) {
        s = advance(s, TICK, still);
        for (const item of s.items) seen.set(item.id, item.x);
      }
      return [...seen.values()];
    };
    const tuned = drops(cfg.width);
    const wide = drops(cfg.maxWidth);
    expect(wide.length).toBeGreaterThan(tuned.length);
    expect(Math.max(...wide)).toBeGreaterThan(cfg.width);
    expect(Math.max(...wide)).toBeLessThanOrEqual(cfg.maxWidth - 18);
  });
});

describe('mistakeCounts', () => {
  it('counts each kind once, in the order it first happened', () => {
    const counts = mistakeCounts(['virus', 'phish', 'virus']);
    expect(counts).toEqual([
      { kind: 'virus', count: 2 },
      { kind: 'phish', count: 1 },
    ]);
  });
});

describe('getting harder', () => {
  it('speeds up twice every rampSeconds, with no cap', () => {
    expect(rampOf(0)).toBe(1);
    expect(rampOf(cfg.rampSeconds)).toBe(2);
    expect(rampOf(cfg.rampSeconds * 5)).toBe(32);
  });

  it('drops items faster later in the run', () => {
    const firstDrop = (time: number) => {
      let s = { ...createRun(3), time };
      while (s.items.length === 0) s = advance(s, TICK, still);
      return s.items[0].vy;
    };
    expect(firstDrop(0)).toBeLessThan(cfg.fallBase + cfg.fallRandom);
    expect(firstDrop(cfg.rampSeconds * 2)).toBeGreaterThanOrEqual(cfg.fallBase * 4);
  });

  it('adds password thieves, then ransomware, at their times', () => {
    expect(threatPool(0)).not.toContain('thief');
    expect(threatPool(cfg.thiefFromSeconds)).toContain('thief');
    expect(threatPool(cfg.thiefFromSeconds)).not.toContain('locker');
    expect(threatPool(cfg.lockerFromSeconds)).toContain('locker');
  });

  // A player with instant reactions: stands under the lowest threat and zaps it when lined up. Guardie's speed and
  // the zap cooldown are its only limits. Wider worlds are harder (more drops, further to run), so the narrowest is
  // the one to check against the five minutes.
  it('beats even a perfect player within five minutes, but not in under two', () => {
    const survive = (seed: number, width: number) => {
      let s: ByteGuardState = createRun(seed, width);
      while (s.mode === 'play' && s.time < 600) {
        const threats = s.items.filter((i) => !KINDS[i.kind].good && !KINDS[i.kind].power && i.y < cfg.playerY - 20);
        const target = threats.sort((a, b) => b.y - a.y)[0];
        const x = target ? target.x : s.playerX;
        s = advance(s, 16, { steer: 0, pointerX: x, fire: !!target && Math.abs(s.playerX - x) < 8 });
      }
      return s.time;
    };
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(survive(seed, cfg.minWidth)).toBeLessThan(300);
      const tuned = survive(seed, cfg.width);
      expect(tuned).toBeGreaterThan(120);
      expect(tuned).toBeLessThan(300);
    }
  });
});
