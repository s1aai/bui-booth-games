import { describe, expect, it } from 'vitest';
import { GOLF_CONFIG } from './config';
import { makeCourse } from './course';
import { HOLES, type Hole } from './data';
import { createGolfReducer, initialGolfState, type GolfState } from './logic';
import { validateHoles } from './validate';

const cfg = GOLF_CONFIG;

/**
 * A simulated golfer: it aims straight at the next thing on the way (the firewall's port, then the tunnel's mouth, then
 * the server), tries a few powers and slight changes of angle, and searches for a way round in `strokes` or fewer.
 */
function canMake(hole: Hole, strokes: number): boolean {
  const r = createGolfReducer(cfg, [hole]);
  const fromStart = (p: { x: number; y: number }) => Math.hypot(p.x - hole.start.x, p.y - hole.start.y);
  const ports = hole.ports.map((p) => ({ ...p, port: true }));
  const mouths = hole.tunnels.map((t) => ({ ...t.from, port: false }));
  const route = [...ports, ...mouths].sort((a, b) => fromStart(a) - fromStart(b));

  const roll = (s: GolfState) => {
    let x = s;
    for (let t = 0; t < 10_000 && x.moving; t += 16) x = r(x, { type: 'TICK', ms: 16 });
    return x;
  };
  const search = (s: GolfState, left: number, next: number): boolean => {
    const target = route[next] ?? hole.hole;
    const aim = Math.atan2(target.y - s.ball.y, target.x - s.ball.x);
    const seen = new Set<string>();
    for (const turn of [0, -0.03, 0.03, -0.06, 0.06]) {
      for (let power = 0.15; power <= 1.001; power += 0.05) {
        const after = roll(r(s, { type: 'SHOOT', angle: aim + turn, power }));
        if (after.sunkAtMs !== null) return true;
        if (left === 1 || !route[next] || after.strokes > s.strokes + 1) continue; // the last stroke, or intercepted
        const newEvents = after.events.slice(s.events.length);
        const passed = route[next].port
          ? Math.sign(after.ball.x - target.x) !== Math.sign(s.ball.x - target.x)
          : newEvents.some((e) => e.type === 'tunnel');
        const key = `${Math.round(after.ball.x / 20)},${Math.round(after.ball.y / 20)}`;
        if (!passed || seen.has(key)) continue;
        seen.add(key);
        if (search(after, left - 1, next + 1)) return true;
      }
    }
    return false;
  };
  return search(initialGolfState([hole]), strokes, 0);
}

describe('makeCourse', () => {
  it('makes a new course from each seed, and the same course from the same seed', () => {
    expect(makeCourse(42)).toEqual(makeCourse(42));
    expect(makeCourse(42)).not.toEqual(makeCourse(43));
    expect(makeCourse(42).map((h) => h.name)).toEqual(['Through the firewall', 'Public Wi-Fi', 'Defence in depth']);
  });

  it('every course passes the validator, and is mirrored every way', () => {
    const starts = new Set<string>();
    for (let seed = 0; seed < 1_000; seed++) {
      const course = makeCourse(seed);
      expect(validateHoles(course), `seed ${seed}`).toEqual([]);
      for (const h of course) starts.add(`${h.start.x < cfg.width / 2 ? 'left' : 'right'} ${h.hole.y < cfg.height / 2 ? 'top' : 'bottom'}`);
    }
    expect(starts.size).toBe(4);
  });

  it('a simulated golfer makes par on every hole', { timeout: 120_000 }, () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const hole of makeCourse(seed)) expect(canMake(hole, hole.par), `seed ${seed}, ${hole.name}`).toBe(true);
    }
  });

  it('...and on the hand-made fallback course', () => {
    for (const hole of HOLES) expect(canMake(hole, hole.par), hole.name).toBe(true);
  });
});
