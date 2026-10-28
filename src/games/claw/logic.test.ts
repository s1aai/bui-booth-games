import { describe, expect, it } from 'vitest';
import { CLAW_CONFIG, type ClawConfig } from './config';
import { ITEMS, type ItemKind } from './data';
import {
  clampX,
  clawPos,
  createClawReducer,
  initialClawState,
  mistakeLessons,
  pickKind,
  slotX,
  type ClawState,
  type Item,
} from './logic';
import { validateItems } from './validate';

const cfg: ClawConfig = CLAW_CONFIG;
const reducer = createClawReducer(cfg);
const index = (id: string) => ITEMS.findIndex((k) => k.id === id);

function advance(state: ClawState, ms: number): ClawState {
  let s = state;
  for (let t = 0; t < ms; t += 16) s = reducer(s, { type: 'TICK', ms: Math.min(16, ms - t) });
  return s;
}

/** A machine with just these items, the claw hanging still over `x`. */
function machine(items: { kind: string; slot: number }[], x: number): ClawState {
  const base = initialClawState(1);
  const list: Item[] = items.map((it, i) => ({ id: i + 1, kind: index(it.kind), slot: it.slot, fallStartMs: -1e9, fallFromY: 0 }));
  return { ...base, items: list, nextId: list.length + 1, trolleyX: x, targetX: x };
}

/** Let go, and wait until the claw is back to waiting (after restoring, or coming up empty). */
function dropAndSettle(state: ClawState): ClawState {
  let s = reducer(state, { type: 'DROP' });
  for (let i = 0; i < 1000 && s.phase !== 'idle' && !s.over; i++) s = reducer(s, { type: 'TICK', ms: 16 });
  return s;
}

/** Hold to steer to `x`, then keep holding for `waitMs` before letting go. Returns the state just as it drops. */
function steerTo(state: ClawState, x: number, waitMs: number): ClawState {
  let s = reducer(state, { type: 'AIM', x });
  for (let t = 0; t < 5_000 && Math.abs(s.trolleyX - x) > 3; t += 16) s = reducer(s, { type: 'TICK', ms: 16 });
  return advance(s, waitMs);
}

/** Where the claw comes down after letting go now. */
function landing(state: ClawState): number {
  let s = reducer(state, { type: 'DROP' });
  let last = s;
  while (s.phase === 'down') {
    last = s;
    s = reducer(s, { type: 'TICK', ms: 8 });
  }
  return clawPos(last).x;
}

describe('the crane', () => {
  it('holding steers the trolley, with momentum: it speeds up, then brakes into place', () => {
    let s = reducer(initialClawState(1), { type: 'AIM', x: 800 });
    expect(s.phase).toBe('aim');
    s = advance(s, 100);
    expect(s.trolleyV).toBeGreaterThan(0);
    expect(s.trolleyV).toBeLessThan(cfg.claw.maxSpeed);
    s = advance(s, 3_000);
    expect(s.trolleyX).toBeCloseTo(800, 0);
  });

  it('the claw swings when the trolley moves, and the swing dies away', () => {
    let s = advance(reducer(initialClawState(1), { type: 'AIM', x: 800 }), 400);
    expect(Math.abs(s.angle)).toBeGreaterThan(0.02);
    s = advance(s, 6_000);
    expect(Math.abs(s.angle)).toBeLessThan(0.005);
  });

  it('letting go drops the claw by itself', () => {
    const s = reducer(steerTo(initialClawState(1), 500, 0), { type: 'DROP' });
    expect(s.phase).toBe('down');
    expect(advance(s, 200).cable).toBeGreaterThan(cfg.claw.restCable);
  });

  it('you have to allow for the swing: dropping at once lands off the mark, waiting lands on it', () => {
    const target = slotX(3);
    const rushed = Math.abs(landing(steerTo({ ...initialClawState(1), items: [] }, target, 0)) - target);
    const patient = Math.abs(landing(steerTo({ ...initialClawState(1), items: [] }, target, 2_000)) - target);
    expect(rushed).toBeGreaterThan(cfg.claw.firmGrip);
    expect(patient).toBeLessThan(cfg.claw.firmGrip);
  });

  it('takes a 0ms frame (or a backwards one) in its stride, even at rest', () => {
    let s = reducer(reducer(initialClawState(1), { type: 'TICK', ms: 0 }), { type: 'TICK', ms: -5 });
    s = advance(reducer(s, { type: 'AIM', x: 800 }), 200);
    expect([s.trolleyX, s.trolleyV, s.angle, s.angVel].every(Number.isFinite)).toBe(true);
    expect(s.trolleyX).toBeGreaterThan(initialClawState(1).trolleyX);
  });

  it('keeps the trolley inside the machine', () => {
    expect(clampX(-500)).toBe(cfg.box.chuteX);
    expect(clampX(99_999)).toBeLessThan(cfg.box.width);
  });
});

describe('grabbing and restoring', () => {
  it('a centred grab restores the item through the chute and scores it', () => {
    const state = dropAndSettle(machine([{ kind: 'key', slot: 3 }], slotX(3)));
    expect(state.score).toBe(ITEMS[index('key')].points);
    expect(state.outcomes.at(-1)).toMatchObject({ type: 'good' });
    expect(state.items).toHaveLength(0);
    expect(state.trolleyX).toBeCloseTo(cfg.box.chuteX, 0);
  });

  it('restoring malware, an infected backup or locked files is a strike; a corrupted file is just wasted', () => {
    for (const kind of ['malware', 'infected', 'locked']) {
      const state = dropAndSettle(machine([{ kind, slot: 2 }], slotX(2)));
      expect(state.strikes, kind).toBe(1);
      expect(state.score).toBe(0);
    }
    const dud = dropAndSettle(machine([{ kind: 'corrupt', slot: 2 }], slotX(2)));
    expect(dud.strikes).toBe(0);
    expect(dud.outcomes.at(-1)?.type).toBe('dud');
  });

  it('grabs the item nearest where the claw came down, and comes up empty if nothing is in reach', () => {
    const between = machine([{ kind: 'malware', slot: 2 }, { kind: 'backup', slot: 3 }], slotX(3) - 10);
    expect(dropAndSettle(between).outcomes.at(-1)).toMatchObject({ kind: index('backup'), type: 'good' });
    const empty = dropAndSettle(machine([{ kind: 'backup', slot: 5 }], slotX(1)));
    expect(empty.outcomes).toHaveLength(0);
    expect(empty.items).toHaveLength(1);
  });

  it('an off-centre grab can slip back into its slot; a centred one never does', () => {
    let slips = 0;
    for (let seed = 0; seed < 200; seed++) {
      const edge = { ...machine([{ kind: 'backup', slot: 4 }], slotX(4) + cfg.claw.grabRange - 1), seed };
      const done = dropAndSettle(edge);
      if (done.outcomes.some((o) => o.type === 'slip')) {
        slips++;
        expect(done.items).toHaveLength(1);
        expect(done.score).toBe(0);
      }
      const centred = dropAndSettle({ ...machine([{ kind: 'backup', slot: 4 }], slotX(4) + cfg.claw.firmGrip - 1), seed });
      expect(centred.outcomes.some((o) => o.type === 'slip')).toBe(false);
    }
    expect(slips).toBeGreaterThan(80);
    expect(slips).toBeLessThan(160);
  });

  it('ignores steering and dropping while the claw is busy', () => {
    const busy = reducer(machine([{ kind: 'backup', slot: 1 }], slotX(1)), { type: 'DROP' });
    expect(reducer(busy, { type: 'DROP' })).toBe(busy);
    expect(reducer(busy, { type: 'AIM', x: 900 })).toBe(busy);
  });

  it('refills an emptied slot after a moment', () => {
    const state = dropAndSettle(machine([{ kind: 'backup', slot: 6 }], slotX(6)));
    expect(state.items.some((i) => i.slot === 6)).toBe(false);
    expect(advance(state, cfg.refillMs + 100).items.some((i) => i.slot === 6)).toBe(true);
  });
});

describe('the round', () => {
  it('keeps changing: the longest-standing item is swapped, never the one under the claw', () => {
    const start = machine([{ kind: 'malware', slot: 0 }, { kind: 'malware', slot: 6 }], slotX(0));
    const later = advance(start, cfg.churnMs);
    expect(later.items.find((i) => i.slot === 0)?.id).toBe(1);
    expect(later.items.find((i) => i.slot === 6)?.id).not.toBe(2);
  });

  it('a patient player never runs out of good items, and the tricky ones arrive later', () => {
    let s = initialClawState(11);
    const kindsSeen = new Set<string>();
    let restored = 0;
    while (!s.over) {
      const target = s.items.find((i) => ITEMS[i.kind].good);
      if ((s.phase === 'idle' || s.phase === 'aim') && target) {
        const x = slotX(target.slot);
        const still = Math.abs(s.trolleyX - x) < 1 && Math.abs(s.angle) < 0.004 && Math.abs(s.angVel) < 0.02;
        s = reducer(s, still ? { type: 'DROP' } : { type: 'AIM', x });
      }
      s = reducer(s, { type: 'TICK', ms: 16 });
      for (const item of s.items) kindsSeen.add(ITEMS[item.kind].id);
      restored = s.outcomes.filter((o) => o.type === 'good').length;
    }
    expect(s.endReason).toBe('time');
    expect(s.strikes).toBe(0);
    expect(restored).toBeGreaterThanOrEqual(5);
    expect(kindsSeen.has('infected') || kindsSeen.has('locked')).toBe(true);
  });

  it('ends after the last strike', () => {
    const state = dropAndSettle({ ...machine([{ kind: 'malware', slot: 2 }], slotX(2)), strikes: 2 });
    expect(state.over).toBe(true);
    expect(state.endReason).toBe('strikes');
  });

  it('ends when the time runs out, and then ignores everything', () => {
    const state = advance(initialClawState(1), cfg.roundMs + 16);
    expect(state.over).toBe(true);
    expect(state.endReason).toBe('time');
    expect(reducer(state, { type: 'DROP' })).toBe(state);
  });

  it('is deterministic: the same seed and actions replay the same game', () => {
    const play = (seed: number) => advance(dropAndSettle(steerTo(initialClawState(seed), slotX(2) + 30, 300)), 1_000);
    expect(play(7)).toEqual(play(7));
  });
});

describe('setup and content', () => {
  it('starts with a full machine, about half good and half bad, and no tricky items yet', () => {
    for (let seed = 0; seed < 50; seed++) {
      const { items } = initialClawState(seed);
      expect(items).toHaveLength(cfg.box.slots);
      expect(items.filter((i) => ITEMS[i.kind].good)).toHaveLength(Math.ceil(cfg.box.slots / 2));
      expect(items.every((i) => ITEMS[i.kind].weights[0] > 0)).toBe(true);
    }
  });

  it('only picks kinds with a weight for the level', () => {
    for (let r = 0; r < 1; r += 0.01) {
      expect(ITEMS[pickKind(r, 1)].weights[0]).toBeGreaterThan(0);
      expect(ITEMS[pickKind(r, 2)].weights[1]).toBeGreaterThan(0);
    }
  });

  it('lists each bad kind restored once, with a count', () => {
    const lessons = mistakeLessons([
      { kind: index('malware'), type: 'strike', points: 0, atMs: 1 },
      { kind: index('backup'), type: 'good', points: 100, atMs: 2 },
      { kind: index('malware'), type: 'strike', points: 0, atMs: 3 },
      { kind: index('corrupt'), type: 'dud', points: 0, atMs: 4 },
    ]);
    expect(lessons.map((l) => [l.kind.id, l.count])).toEqual([
      ['malware', 2],
      ['corrupt', 1],
    ]);
  });

  it('passes the startup validator, which catches bad kinds', () => {
    expect(validateItems(ITEMS)).toEqual([]);
    const bad: ItemKind = { ...ITEMS[0], id: 'backup', good: true, points: 0 };
    expect(validateItems([bad, bad]).join('\n')).toMatch(/listed twice[\s\S]*scores points[\s\S]*no bad items/);
  });
});
