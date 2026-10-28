import { describe, expect, it } from 'vitest';
import { GOLF_CONFIG } from './config';
import { HOLES, type Hole } from './data';
import { createGolfReducer, holePoints, initialGolfState, type GolfState } from './logic';
import { validateHoles } from './validate';

const cfg = GOLF_CONFIG;
const open: Hole = { name: 'Open', par: 2, start: { x: 100, y: 300 }, hole: { x: 700, y: 300 }, walls: [], sniffers: [], tunnels: [], ports: [] };

/** Ticks until the ball stops (or the hole ends). */
function roll(r: ReturnType<typeof createGolfReducer>, s: GolfState): GolfState {
  let x = s;
  for (let t = 0; t < 10_000 && x.moving; t += 16) x = r(x, { type: 'TICK', ms: 16 });
  return x;
}
const shoot = (r: ReturnType<typeof createGolfReducer>, s: GolfState, power: number, angle = 0) =>
  roll(r, r(s, { type: 'SHOOT', angle, power }));
const pause = (r: ReturnType<typeof createGolfReducer>, s: GolfState) => {
  let x = s;
  for (let t = 0; t < cfg.sinkPauseMs + 100; t += 50) x = r(x, { type: 'TICK', ms: 50 });
  return x;
};

/** The weakest straight shot (in steps of 0.05) that drops in on `hole`. */
function sinkingPower(hole: Hole): number {
  const r = createGolfReducer(cfg, [hole]);
  for (let p = 0.05; p <= 1; p += 0.05) if (shoot(r, initialGolfState([hole]), p).sunkAtMs !== null) return p;
  return -1;
}

describe('golfReducer', () => {
  it('a straight putt at the right power drops in, and scores', () => {
    const power = sinkingPower(open);
    expect(power).toBeGreaterThan(0);
    const r = createGolfReducer(cfg, [open]);
    const s = shoot(r, initialGolfState([open]), power);
    expect(s.card).toEqual([1]);
    expect(s.score).toBe(holePoints(1, 2));
  });

  it('a weak putt stops short, and the next shot is taken from there', () => {
    const r = createGolfReducer(cfg, [open]);
    const s = shoot(r, initialGolfState([open]), 0.1);
    expect(s.moving).toBe(false);
    expect(s.ball.x).toBeGreaterThan(100);
    expect(s.ball.x).toBeLessThan(700);
    expect(s.strokes).toBe(1);
  });

  it('bounces off a wall instead of going through it', () => {
    const walled: Hole = { ...open, walls: [{ x: 400, y: 0, w: 40, h: 600 }] };
    const r = createGolfReducer(cfg, [walled]);
    const s = shoot(r, initialGolfState([walled]), 1);
    expect(s.ball.x).toBeLessThan(400);
    expect(s.sunkAtMs).toBeNull();
  });

  it('a sniffer zone intercepts: a penalty stroke, and back to where it was hit from', () => {
    const sniffed: Hole = { ...open, sniffers: [{ x: 300, y: 200, w: 100, h: 200 }] };
    const r = createGolfReducer(cfg, [sniffed]);
    const s = shoot(r, initialGolfState([sniffed]), 0.8);
    expect(s.strokes).toBe(2);
    expect(s.ball).toMatchObject({ x: 100, y: 300 });
    expect(s.events.at(-1)?.type).toBe('intercepted');
  });

  it('a tunnel carries the ball past the sniffer to its exit', () => {
    const tunnelled: Hole = {
      ...open,
      sniffers: [{ x: 300, y: 200, w: 200, h: 200 }],
      tunnels: [{ from: { x: 220, y: 300 }, to: { x: 560, y: 300 } }],
    };
    const r = createGolfReducer(cfg, [tunnelled]);
    const s = shoot(r, initialGolfState([tunnelled]), 0.8);
    expect(s.events.some((e) => e.type === 'tunnel')).toBe(true);
    expect(s.events.some((e) => e.type === 'intercepted')).toBe(false);
  });

  it('lets the ball out of a tunnel gently, however hard it went in', () => {
    const tunnelled: Hole = { ...open, hole: { x: 700, y: 500 }, tunnels: [{ from: { x: 220, y: 300 }, to: { x: 560, y: 300 } }] };
    const r = createGolfReducer(cfg, [tunnelled]);
    let s = r(initialGolfState([tunnelled]), { type: 'SHOOT', angle: 0, power: 1 });
    while (!s.events.some((e) => e.type === 'tunnel')) s = r(s, { type: 'TICK', ms: 16 });
    expect(Math.hypot(s.ball.vx, s.ball.vy)).toBeGreaterThan(0);
    expect(Math.hypot(s.ball.vx, s.ball.vy)).toBeLessThanOrEqual(cfg.tunnelExitSpeed);
  });

  it('moves on to the next hole after the pause, and ends after the last', () => {
    const power = sinkingPower(open);
    const r = createGolfReducer(cfg, [open, open]);
    let s = pause(r, shoot(r, initialGolfState([open, open]), power));
    expect(s.hole).toBe(1);
    expect(s.strokes).toBe(0);
    s = pause(r, shoot(r, s, power));
    expect(s.over).toBe(true);
    expect(s.card).toEqual([1, 1]);
  });

  it('gives up on a hole after the maximum strokes', () => {
    const r = createGolfReducer(cfg, [open]);
    let s = initialGolfState([open]);
    for (let i = 0; i < cfg.maxStrokes; i++) s = shoot(r, s, 0.02, Math.PI); // tiny taps backwards
    expect(s.events.at(-1)?.type).toBe('gaveUp');
    expect(s.card).toEqual([cfg.maxStrokes]);
  });

  it('ignores a shot while the ball is rolling', () => {
    const r = createGolfReducer(cfg, [open]);
    const rolling = r(initialGolfState([open]), { type: 'SHOOT', angle: 0, power: 0.3 });
    expect(r(rolling, { type: 'SHOOT', angle: 1, power: 1 })).toBe(rolling);
  });

  it('points: par is parPoints; strokes over cost, strokes under earn', () => {
    expect(holePoints(3, 3)).toBe(cfg.parPoints);
    expect(holePoints(5, 3)).toBe(cfg.parPoints - 2 * cfg.strokePoints);
    expect(holePoints(1, 3)).toBe(cfg.parPoints + 2 * cfg.strokePoints);
    expect(holePoints(99, 3)).toBe(0);
  });
});

describe('the course', () => {
  it('passes the startup validator, which catches a start inside a wall', () => {
    expect(validateHoles(HOLES)).toEqual([]);
    expect(validateHoles([{ ...open, walls: [{ x: 90, y: 290, w: 20, h: 20 }] }]).join()).toMatch(/inside a wall/);
  });

  it('every hole can be played to the end by a simple golfer who aims straight at the hole', () => {
    // Not a solver: just proves nothing is impossible or stuck (the max-strokes rule always ends a hole).
    for (let i = 0; i < HOLES.length; i++) {
      const r = createGolfReducer(cfg, [HOLES[i]]);
      let s = initialGolfState([HOLES[i]]);
      for (let shot = 0; shot < cfg.maxStrokes + 2 && s.sunkAtMs === null; shot++) {
        const angle = Math.atan2(HOLES[i].hole.y - s.ball.y, HOLES[i].hole.x - s.ball.x);
        s = shoot(r, s, 0.5, angle);
      }
      expect(s.sunkAtMs, HOLES[i].name).not.toBeNull();
    }
  });
});
