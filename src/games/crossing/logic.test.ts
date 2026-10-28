import { describe, expect, it } from 'vitest';
import { CROSSING_CONFIG, type CrossingConfig } from './config';
import { columns, createCrossingReducer, hitAt, hitLessons, initialCrossingState, onSecureRoute, type CrossingState } from './logic';
import { validateField } from './validate';

const cfg: CrossingConfig = CROSSING_CONFIG;
const reducer = createCrossingReducer(cfg);
const LAST = columns(cfg) - 1;
const trafficCol = cfg.lanes.findIndex((l) => l.type === 'traffic') + 1;
const routerCol = cfg.lanes.findIndex((l) => l.type === 'router') + 1;

/** A field with no threats and no hacked routers, the packet at (col, row), free to hop. */
function clear(col = 0, row = cfg.startRow): CrossingState {
  const base = initialCrossingState(1);
  return {
    ...base,
    lanes: base.lanes.map((l) => ({ ...l, threats: [], hacked: [] })),
    packet: { col, row },
    hopReadyMs: 0,
  };
}
const move = (s: CrossingState, dx: number, dy: number) => reducer(s, { type: 'MOVE', dx, dy });
const wait = (s: CrossingState, ms: number) => {
  let x = s;
  for (let t = 0; t < ms; t += 100) x = reducer(x, { type: 'TICK', ms: Math.min(100, ms - t) });
  return x;
};

describe('crossingReducer', () => {
  it('hops one cell, stays on the field, and remembers a hop asked for during the cooldown', () => {
    let s = move(clear(), 1, 0);
    expect(s.packet).toEqual({ col: 1, row: cfg.startRow });
    s = move(s, 1, 0); // too soon: queued, not lost
    expect(s.packet.col).toBe(1);
    expect(s.queued).toEqual({ dx: 1, dy: 0 });
    s = wait(s, cfg.hopMs);
    expect(s.packet.col).toBe(2);
    expect(s.queued).toBeNull();
    expect(move(clear(0, 0), 0, -1)).toMatchObject({ packet: { col: 0, row: 0 } });
    expect(move(clear(0, cfg.startRow), -1, 0).packet).toEqual({ col: 0, row: cfg.startRow });
  });

  it('delivers at the server, with an Express bonus when quick, then starts a new packet', () => {
    let s = clear(LAST - 1, 3);
    s = move(s, 1, 0);
    expect(s.delivered).toBe(1);
    expect(s.score).toBe(cfg.scoring.delivered + cfg.scoring.express);
    expect(s.packet).toEqual({ col: 0, row: cfg.startRow });
    const slow = move({ ...clear(LAST - 1, 3), timeMs: cfg.scoring.expressMs + 1 }, 1, 0);
    expect(slow.score).toBe(cfg.scoring.delivered);
  });

  it('a threat on the packet is a strike, and the packet starts again', () => {
    const s = clear(trafficCol, 3);
    const lanes = s.lanes.map((l, i) => (i === trafficCol - 1 ? { ...l, threats: [3.2] } : l));
    const hit = reducer({ ...s, lanes }, { type: 'TICK', ms: 1 });
    expect(hit.strikes).toBe(1);
    expect(hit.packet).toEqual({ col: 0, row: cfg.startRow });
    expect(hit.events.at(-1)).toMatchObject({ type: 'hit', kind: 'traffic' });
  });

  it('hopping onto a hacked router is a strike; a safe one is fine', () => {
    const s = clear(routerCol - 1, 2);
    const lanes = s.lanes.map((l, i) => (i === routerCol - 1 ? { ...l, hacked: [2] } : l));
    expect(move({ ...s, lanes }, 1, 0).strikes).toBe(1);
    expect(move(s, 1, 0).strikes).toBe(0);
  });

  it('the secure route is safe from everything, but slow', () => {
    const s = clear(trafficCol, 0);
    const lanes = s.lanes.map((l, i) => (i === trafficCol - 1 ? { ...l, threats: [0] } : l));
    const safe = reducer({ ...s, lanes }, { type: 'TICK', ms: 1 });
    expect(safe.strikes).toBe(0);
    expect(onSecureRoute(trafficCol, 0)).toBe(true);
    expect(onSecureRoute(0, 0)).toBe(false);
    const hopped = move(clear(1, 0), 1, 0);
    expect(hopped.hopReadyMs - hopped.timeMs).toBe(cfg.secureHopMs);
    expect(hopped.tripSecure).toBe(true);
  });

  it('three hits end the game; so does the clock', () => {
    const s = { ...clear(routerCol - 1, 2), strikes: 2 };
    const lanes = s.lanes.map((l, i) => (i === routerCol - 1 ? { ...l, hacked: [2] } : l));
    const over = move({ ...s, lanes }, 1, 0);
    expect(over.over).toBe(true);
    expect(over.endReason).toBe('strikes');
    const timeUp = wait(clear(), cfg.roundMs);
    expect(timeUp.endReason).toBe('time');
    expect(move(timeUp, 1, 0)).toBe(timeUp);
  });

  it('threats keep moving and wrapping, and speed up after each delivery', () => {
    const start = initialCrossingState(2);
    const later = wait(start, 5_000);
    const lane = later.lanes[trafficCol - 1];
    expect(lane.threats.every((y) => y >= -1 && y < cfg.rows + 1)).toBe(true);
    expect(lane.threats).not.toEqual(start.lanes[trafficCol - 1].threats);
    const delivered = move(clear(LAST - 1, 3), 1, 0);
    expect(delivered.speedFactor).toBeCloseTo(cfg.speedUp);
  });

  it('is deterministic: the same seed and actions replay the same game', () => {
    const play = (seed: number) => wait(move(initialCrossingState(seed), 1, 0), 3_000);
    expect(play(9)).toEqual(play(9));
  });
});

describe('setup', () => {
  it('starts with threats in every threat lane and hacked routers off the secure route', () => {
    for (let seed = 0; seed < 30; seed++) {
      const s = initialCrossingState(seed);
      s.lanes.forEach((lane) => {
        if (lane.type === 'router') {
          expect(lane.hacked).toHaveLength(cfg.hackedPerRouterLane);
          expect(lane.hacked.every((r) => r > 0 && r < cfg.rows)).toBe(true);
        } else expect(lane.threats.length).toBeGreaterThan(0);
      });
      expect(hitAt({ ...s, packet: { col: 0, row: cfg.startRow } })).toBeNull();
    }
  });

  it('counts hits by kind for the lessons', () => {
    const events = [
      { type: 'hit' as const, kind: 'ddos' as const, col: 4, row: 3, points: 0, atMs: 1 },
      { type: 'delivered' as const, col: 8, row: 3, points: 100, atMs: 2 },
      { type: 'hit' as const, kind: 'ddos' as const, col: 4, row: 2, points: 0, atMs: 3 },
    ];
    expect(hitLessons(events)).toEqual([{ kind: 'ddos', count: 2 }]);
  });

  it('the field passes the startup validator, which catches a secure route that is not slower', () => {
    expect(validateField(cfg)).toEqual([]);
    expect(validateField({ ...cfg, secureHopMs: cfg.hopMs }).join()).toMatch(/slower/);
  });
});
