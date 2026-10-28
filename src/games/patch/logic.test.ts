import { describe, expect, it } from 'vitest';
import { PATCH_CONFIG, type PatchConfig } from './config';
import { SERVERS, VULNERABILITIES } from './data';
import {
  createPatchReducer,
  exploitLessons,
  initialPatchState,
  timeLeft,
  weightedIndex,
  type PatchAction,
  type PatchState,
  type Vuln,
} from './logic';
import { validatePatchContent } from './validate';

// A simple config for exact timings: the first spawn at 1s, then every 1s (no speed-up), 3s to patch anything.
const cfg: PatchConfig = {
  ...PATCH_CONFIG,
  severities: {
    critical: { label: 'Critical', points: 200, weight: 1, deadlineMs: 3_000, onExploit: 'breach' },
    high: { label: 'High', points: 100, weight: 1, deadlineMs: 3_000, onExploit: 'strike' },
    low: { label: 'Low', points: 50, weight: 1, deadlineMs: 3_000, onExploit: 'nothing' },
  },
  spawn: { firstDelayMs: 1_000, startIntervalMs: 1_000, halfLifeMs: Infinity },
  deadlineHalfLifeMs: Infinity,
  missPenalty: 10,
  maxTickMs: 100,
};
const reducer = createPatchReducer(cfg);

/** Runs `ms` of game time in 100ms ticks. */
function advance(state: PatchState, ms: number, r = reducer): PatchState {
  let s = state;
  for (let t = 0; t < ms; t += 100) s = r(s, { type: 'TICK', ms: Math.min(100, ms - t) });
  return s;
}

const vuln = (server: number, severity: Vuln['severity'], kind = 0): Vuln => ({
  id: server + 1,
  server,
  severity,
  kind,
  spawnedMs: 0,
  deadlineMs: 3_000,
});

describe('patchReducer', () => {
  it('spawns the first vulnerability after the first delay, then on the interval', () => {
    const start = initialPatchState(1, cfg);
    expect(advance(start, 900).active).toHaveLength(0);
    expect(advance(start, 1_000).active).toHaveLength(1);
    expect(advance(start, 2_000).active).toHaveLength(2);
  });

  it('is deterministic: the same seed and actions replay the same game', () => {
    const a = advance(initialPatchState(42, cfg), 5_000);
    const b = advance(initialPatchState(42, cfg), 5_000);
    expect(a).toEqual(b);
    expect(advance(initialPatchState(43, cfg), 5_000).active).not.toEqual(a.active);
  });

  it('never puts two vulnerabilities on one server, and skips a spawn when every server is busy', () => {
    const quickCfg: PatchConfig = { ...cfg, spawn: { firstDelayMs: 100, startIntervalMs: 100, halfLifeMs: Infinity } };
    const state = advance(initialPatchState(7, quickCfg), 2_900, createPatchReducer(quickCfg));
    const servers = state.active.map((v) => v.server);
    expect(new Set(servers).size).toBe(servers.length);
    expect(state.active).toHaveLength(SERVERS.length);
  });

  it('never spawns on a server while its message is still showing', () => {
    // Every server but 5 has a vulnerability; 5 was just patched, so its "+200" is up when the next spawn is due.
    const others = SERVERS.map((_, i) => i).filter((i) => i !== 5);
    const patched = reducer(
      { ...initialPatchState(1, cfg), nextSpawnMs: 100, active: [...others.map((i) => vuln(i, 'low')), vuln(5, 'low')] },
      { type: 'PATCH', server: 5 },
    );
    const during = reducer(patched, { type: 'TICK', ms: 100 });
    expect(during.active.some((v) => v.server === 5)).toBe(false);
    // The skipped spawn moved the next one to 1.1s, after the message has gone.
    expect(advance(during, 1_000).active.some((v) => v.server === 5)).toBe(true);
  });

  it('patching scores the severity points and clears the server', () => {
    const state = { ...initialPatchState(1, cfg), active: [vuln(4, 'critical')] };
    const next = reducer(state, { type: 'PATCH', server: 4 });
    expect(next.score).toBe(200);
    expect(next.active).toHaveLength(0);
    expect(next.patched).toHaveLength(1);
    expect(next.flashes.at(-1)).toMatchObject({ server: 4, type: 'patched', points: 200 });
  });

  it('tapping a server with nothing to patch costs points, but never below zero', () => {
    const state = { ...initialPatchState(1, cfg), score: 15 };
    const once = reducer(state, { type: 'PATCH', server: 0 });
    expect(once.score).toBe(5);
    expect(once.misses).toBe(1);
    expect(reducer(once, { type: 'PATCH', server: 0 }).score).toBe(0);
  });

  it('an exploited High is a strike; an exploited Low costs nothing', () => {
    const state = { ...initialPatchState(1, cfg), nextSpawnMs: 1e9, active: [vuln(1, 'high'), vuln(2, 'low')] };
    const next = advance(state, 3_000);
    expect(next.active).toHaveLength(0);
    expect(next.exploited).toHaveLength(2);
    expect(next.strikes).toBe(1);
    expect(next.over).toBe(false);
  });

  it('an exploited Critical is game over at once (a breach)', () => {
    const state = { ...initialPatchState(1, cfg), nextSpawnMs: 1e9, active: [vuln(0, 'critical')] };
    const over = advance(state, 3_000);
    expect(over.strikes).toBe(0);
    expect(over.over).toBe(true);
    expect(over.endReason).toBe('breach');
  });

  it('ends at the third strike and then ignores everything', () => {
    const state = { ...initialPatchState(1, cfg), nextSpawnMs: 1e9, active: [vuln(0, 'high'), vuln(1, 'high'), vuln(2, 'high')] };
    const over = advance(state, 3_000);
    expect(over.strikes).toBe(3);
    expect(over.over).toBe(true);
    expect(over.endReason).toBe('strikes');
    const actions: PatchAction[] = [{ type: 'TICK', ms: 100 }, { type: 'PATCH', server: 5 }];
    for (const action of actions) expect(reducer(over, action)).toBe(over);
  });

  it('caps a long tick, so a stalled window does not leap ahead', () => {
    const state = reducer(initialPatchState(1, cfg), { type: 'TICK', ms: 60_000 });
    expect(state.timeMs).toBe(cfg.maxTickMs);
  });

  it('halves the gap between spawns every halfLifeMs, with no floor', () => {
    const fast = createPatchReducer(PATCH_CONFIG);
    let state = initialPatchState(3);
    for (let i = 0; i < 2_000; i++) {
      state = fast(state, { type: 'TICK', ms: 100 });
      // Patch everything so the game doesn't end.
      for (const v of state.active) state = fast(state, { type: 'PATCH', server: v.server });
    }
    expect(state.over).toBe(false);
    const { startIntervalMs, halfLifeMs } = PATCH_CONFIG.spawn;
    const lastSpawnMs = state.nextSpawnMs - state.intervalMs;
    expect(state.intervalMs).toBeCloseTo(startIntervalMs * 0.5 ** (lastSpawnMs / halfLifeMs));
    expect(state.intervalMs).toBeLessThan(startIntervalMs / 2 ** 4);
  });

  it('halves the time to patch every deadlineHalfLifeMs', () => {
    const at = (ms: number) => {
      const late = { ...cfg, spawn: { ...cfg.spawn, firstDelayMs: ms }, deadlineHalfLifeMs: 10_000 };
      const [v] = advance(initialPatchState(1, late), ms, createPatchReducer(late)).active;
      return v.deadlineMs - v.spawnedMs;
    };
    expect(at(1_000)).toBeCloseTo(3_000 * 0.5 ** 0.1);
    expect(at(20_000)).toBeCloseTo(750);
  });

  it('beats a perfect player tapping 5 times a second before 5 minutes, but not in the first 2', () => {
    const game = createPatchReducer(PATCH_CONFIG);
    for (let seed = 1; seed <= 5; seed++) {
      let state = initialPatchState(seed);
      let nextTapMs = 0;
      while (!state.over && state.timeMs < 600_000) {
        state = game(state, { type: 'TICK', ms: 50 });
        if (state.timeMs < nextTapMs || state.active.length === 0) continue;
        // The most urgent Critical or High first, Lows only when nothing else is waiting.
        const [first] = [...state.active].sort(
          (a, b) => Number(a.severity === 'low') - Number(b.severity === 'low') || a.deadlineMs - b.deadlineMs,
        );
        state = game(state, { type: 'PATCH', server: first.server });
        nextTapMs = state.timeMs + 200;
      }
      expect(state.timeMs).toBeGreaterThan(120_000);
      expect(state.timeMs).toBeLessThan(300_000);
    }
  });

  it('forgets flashes once they have shown', () => {
    const state = reducer({ ...initialPatchState(1, cfg), nextSpawnMs: 1e9 }, { type: 'PATCH', server: 3 });
    expect(state.flashes).toHaveLength(1);
    expect(advance(state, cfg.flashMs).flashes).toHaveLength(0);
  });
});

describe('helpers', () => {
  it('weightedIndex picks in proportion to the weights', () => {
    expect(weightedIndex([2, 3, 5], 0)).toBe(0);
    expect(weightedIndex([2, 3, 5], 0.19)).toBe(0);
    expect(weightedIndex([2, 3, 5], 0.2)).toBe(1);
    expect(weightedIndex([2, 3, 5], 0.5)).toBe(2);
    expect(weightedIndex([2, 3, 5], 0.9999)).toBe(2);
  });

  it('timeLeft runs from 1 to 0', () => {
    const v = { ...vuln(0, 'low'), spawnedMs: 1_000, deadlineMs: 3_000 };
    expect(timeLeft(v, 1_000)).toBe(1);
    expect(timeLeft(v, 2_000)).toBe(0.5);
    expect(timeLeft(v, 5_000)).toBe(0);
  });

  it('exploitLessons lists each kind once, most severe first, with the servers it hit', () => {
    const critical = VULNERABILITIES.findIndex((v) => v.severity === 'critical');
    const low = VULNERABILITIES.findIndex((v) => v.severity === 'low');
    const lessons = exploitLessons([vuln(2, 'low', low), vuln(5, 'critical', critical), vuln(0, 'critical', critical)]);
    expect(lessons.map((l) => l.severity)).toEqual(['critical', 'low']);
    expect(lessons[0].servers).toEqual([SERVERS[0], SERVERS[5]]);
  });
});

describe('content', () => {
  it('passes the startup validator', () => {
    expect(validatePatchContent(SERVERS, VULNERABILITIES)).toEqual([]);
  });

  it('the validator catches a wrong-sized board, duplicates and a missing severity', () => {
    const problems = validatePatchContent(['A', 'A'], [{ name: 'X', severity: 'low', why: 'Why.' }]).join();
    expect(problems).toMatch(/exactly 9/);
    expect(problems).toMatch(/same name/);
    expect(problems).toMatch(/No critical/);
  });
});
