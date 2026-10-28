import { describe, expect, it } from 'vitest';
import { FIREWALL_CONFIG, type FirewallConfig } from './config';
import { FILES, type FileItem } from './data';
import {
  createFirewallReducer,
  initialFirewallState,
  levelFor,
  mistakeLessons,
  progress,
  type Drop,
  type FirewallState,
} from './logic';
import { validateFiles } from './validate';

// Exact timings: the first file at 1s, then every 1s, each taking 4s to fall; no speed-up.
const cfg: FirewallConfig = {
  ...FIREWALL_CONFIG,
  lanes: 4,
  fall: { startMs: 4_000, minMs: 4_000, decay: 1 },
  spawn: { ...FIREWALL_CONFIG.spawn, firstDelayMs: 1_000, startIntervalMs: 1_000, minIntervalMs: 1_000, decay: 1 },
  maxTickMs: 100,
};
const files: FileItem[] = [
  { name: 'bad.exe', dangerous: true, difficulty: 1, why: 'Bad.' },
  { name: 'good.pdf', dangerous: false, difficulty: 1, why: 'Good.' },
];
const reducer = createFirewallReducer(cfg, files);

function advance(state: FirewallState, ms: number, r = reducer): FirewallState {
  let s = state;
  for (let t = 0; t < ms; t += 100) s = r(s, { type: 'TICK', ms: Math.min(100, ms - t) });
  return s;
}

/** A state with one file already falling, and no more to come. */
function withDrop(file: number): FirewallState {
  const drop: Drop = { id: 1, file, lane: 0, spawnedMs: 0, landMs: 4_000 };
  return { ...initialFirewallState(1, cfg), nextSpawnMs: 1e9, nextId: 2, drops: [drop] };
}

describe('firewallReducer', () => {
  it('spawns files on the interval, and they fall', () => {
    const start = initialFirewallState(1, cfg);
    expect(advance(start, 900).drops).toHaveLength(0);
    const one = advance(start, 1_000);
    expect(one.drops).toHaveLength(1);
    expect(progress(one.drops[0], one.timeMs)).toBe(0);
    expect(progress(one.drops[0], one.timeMs + 2_000)).toBe(0.5);
    expect(advance(start, 3_000).drops).toHaveLength(3);
  });

  it('is deterministic: the same seed and actions replay the same game', () => {
    expect(advance(initialFirewallState(42, cfg), 8_000)).toEqual(advance(initialFirewallState(42, cfg), 8_000));
  });

  it('blocking a dangerous file scores; blocking a safe one is a strike', () => {
    const blocked = reducer(withDrop(0), { type: 'BLOCK', id: 1 });
    expect(blocked.score).toBe(cfg.scoring.blocked);
    expect(blocked.drops).toHaveLength(0);
    expect(blocked.outcomes.at(-1)?.type).toBe('blocked');
    const wrong = reducer(withDrop(1), { type: 'BLOCK', id: 1 });
    expect(wrong.strikes).toBe(1);
    expect(wrong.score).toBe(0);
    expect(wrong.outcomes.at(-1)?.type).toBe('wrongBlock');
  });

  it('a dangerous file that lands is a strike; a safe one scores', () => {
    const breach = advance(withDrop(0), 4_000);
    expect(breach.strikes).toBe(1);
    expect(breach.outcomes.at(-1)).toMatchObject({ type: 'breach', progress: 1 });
    const delivered = advance(withDrop(1), 4_000);
    expect(delivered.strikes).toBe(0);
    expect(delivered.score).toBe(cfg.scoring.delivered);
  });

  it('good calls in a row build a streak bonus; a mistake resets it', () => {
    let state = reducer(withDrop(0), { type: 'BLOCK', id: 1 });
    state = { ...state, drops: [{ id: 2, file: 0, lane: 1, spawnedMs: 0, landMs: 4_000 }] };
    state = reducer(state, { type: 'BLOCK', id: 2 });
    expect(state.score).toBe(cfg.scoring.blocked + Math.round(cfg.scoring.blocked * 1.1));
    expect(state.streak).toBe(2);
    state = { ...state, drops: [{ id: 3, file: 1, lane: 1, spawnedMs: 0, landMs: 4_000 }] };
    state = reducer(state, { type: 'BLOCK', id: 3 });
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(2);
  });

  it('ends at the third strike and then ignores everything', () => {
    let state = { ...withDrop(1), strikes: 2 };
    state = reducer(state, { type: 'BLOCK', id: 1 });
    expect(state.over).toBe(true);
    expect(reducer(state, { type: 'TICK', ms: 100 })).toBe(state);
  });

  it('never starts a file on top of one that has only just started falling', () => {
    const quick = { ...cfg, lanes: 2, spawn: { ...cfg.spawn, firstDelayMs: 100, startIntervalMs: 100, minIntervalMs: 100 } };
    const state = advance(initialFirewallState(5, quick), 200, createFirewallReducer(quick, files));
    // Two files 100ms apart: the second must go in the other column.
    expect(state.drops.map((d) => d.lane).sort()).toEqual([0, 1]);
  });

  it('brings trickier files in as the game goes on, and speeds up', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(FIREWALL_CONFIG.spawn.filesPerLevel)).toBe(2);
    expect(levelFor(1_000)).toBe(3);
    let state = initialFirewallState(9);
    const real = createFirewallReducer(FIREWALL_CONFIG);
    const seen = new Set<number>();
    for (let i = 0; i < 600; i++) {
      state = real(state, { type: 'TICK', ms: 100 });
      // Play perfectly: block the dangerous files, and let the safe ones land.
      for (const d of state.drops) if (FILES[d.file].dangerous) state = real(state, { type: 'BLOCK', id: d.id });
      for (const d of state.drops) seen.add(FILES[d.file].difficulty);
    }
    expect(state.strikes).toBe(0);
    expect(seen).toEqual(new Set([1, 2, 3]));
    expect(state.fallMs).toBeLessThan(FIREWALL_CONFIG.fall.startMs);
  });

  it('caps a long tick', () => {
    expect(reducer(initialFirewallState(1, cfg), { type: 'TICK', ms: 60_000 }).timeMs).toBe(cfg.maxTickMs);
  });
});

describe('mistakeLessons', () => {
  it('lists each missed file once, with how many times', () => {
    const state = advance(withDrop(0), 4_000);
    const again = { ...state, drops: [{ id: 5, file: 0, lane: 2, spawnedMs: 4_000, landMs: 8_000 }] };
    const lessons = mistakeLessons(advance(again, 4_000).outcomes, files);
    expect(lessons).toEqual([{ file: files[0], type: 'breach', count: 2 }]);
  });
});

describe('content', () => {
  it('passes the startup validator', () => {
    expect(validateFiles(FILES)).toEqual([]);
  });

  it('the danger matches the last extension', () => {
    const risky = new Set(['exe', 'bat', 'vbs', 'js', 'scr', 'cmd', 'msi', 'xlsm', 'docm', 'iso', 'lnk']);
    for (const file of FILES) {
      const ext = file.name.split('.').pop()!.toLowerCase();
      expect(risky.has(ext), file.name).toBe(file.dangerous);
    }
  });

  it('the validator catches bad names, duplicates and a thin difficulty', () => {
    const problems = validateFiles([
      { name: 'noextension', dangerous: true, difficulty: 1, why: 'x' },
      { name: 'a.exe', dangerous: true, difficulty: 1, why: 'x' },
      { name: 'A.EXE', dangerous: true, difficulty: 1, why: 'x' },
    ]).join('\n');
    expect(problems).toMatch(/not a file name/);
    expect(problems).toMatch(/listed twice/);
    expect(problems).toMatch(/Difficulty 1 needs at least 3 safe/);
  });
});
