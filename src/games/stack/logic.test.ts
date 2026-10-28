import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../shell/rng';
import { STACK_CONFIG, type StackConfig } from './config';
import { BLOCKS } from './data';
import { createStackReducer, initialStackState, judge, offer, top, type StackState } from './logic';
import { validateBlocks } from './validate';

const cfg: StackConfig = STACK_CONFIG;
const reducer = createStackReducer(cfg);
const k = (id: string) => BLOCKS.findIndex((b) => b.id === id);

/** A state waiting for a pick, offering exactly these two kinds. */
const offering = (state: StackState, a: string, b: string): StackState => ({ ...state, phase: 'pick', options: [k(a), k(b)] });

/** Picks `id` (offered first) and drops it `offset` units off the block below. */
function place(state: StackState, id: string, offset = 0): StackState {
  const picked = reducer(offering(state, id, 'web'), { type: 'PICK', option: 0 });
  const withX = { ...picked, sliding: { ...picked.sliding!, x: top(picked).x + offset } };
  return reducer(withX, { type: 'DROP' });
}

describe('judge: the security rules', () => {
  it('a database must be covered by a protect block', () => {
    expect(judge(k('web'), k('database'))).toBe('exposed');
    expect(judge(k('database'), k('database'))).toBe('exposed');
    expect(judge(k('firewall'), k('database'))).toBe('protected');
    expect(judge(k('login'), k('database'))).toBe('protected');
  });

  it('protecting a web server scores; two different protect blocks are defence in depth', () => {
    expect(judge(k('firewall'), k('web'))).toBe('protected');
    expect(judge(k('login'), k('firewall'))).toBe('depth');
    expect(judge(k('firewall'), k('firewall'))).toBeNull();
    expect(judge(k('web'), k('web'))).toBeNull();
    expect(judge(k('database'), -1)).toBeNull();
  });
});

describe('stackReducer', () => {
  const start = initialStackState(1);

  it('a perfect drop keeps the full width and scores its bonus', () => {
    const state = place(start, 'web', 3);
    expect(state.blocks).toHaveLength(2);
    expect(top(state).width).toBe(cfg.view.startWidth);
    expect(state.events.map((e) => e.type)).toEqual(['perfect']);
    expect(state.score).toBe(BLOCKS[k('web')].points + cfg.bonus.perfect);
  });

  it('an off-centre drop slices the overhang off', () => {
    const state = place(start, 'web', 100);
    expect(top(state).width).toBe(cfg.view.startWidth - 100);
    expect(top(state).x).toBe(top(start).x + 100);
    expect(state.cut).toMatchObject({ width: 100, x: top(start).x + cfg.view.startWidth });
  });

  it('missing the tower entirely collapses it', () => {
    const state = place(start, 'web', cfg.view.startWidth + 5);
    expect(state.phase).toBe('over');
    expect(state.endReason).toBe('collapse');
  });

  it('an exposed database is a strike, marked on the tower', () => {
    const state = place(place(start, 'database'), 'web');
    expect(state.strikes).toBe(1);
    expect(state.blocks[1].exposed).toBe(true);
    expect(state.events.some((e) => e.type === 'exposed')).toBe(true);
  });

  it('covering a database scores Protected, then a second layer scores defence in depth', () => {
    const state = place(place(place(start, 'database'), 'firewall'), 'login');
    expect(state.strikes).toBe(0);
    const types = state.events.map((e) => e.type).filter((t) => t !== 'perfect');
    expect(types).toEqual(['protected', 'depth']);
  });

  it('three exposed databases breach the system', () => {
    let state = start;
    for (let i = 0; i < 3; i++) state = place(place(state, 'database'), 'web');
    expect(state.phase).toBe('over');
    expect(state.endReason).toBe('strikes');
  });

  it('the block slides back and forth, and faster after every block', () => {
    let state = reducer(offering(start, 'web', 'login'), { type: 'PICK', option: 0 });
    const maxX = cfg.view.width - top(state).width;
    for (let i = 0; i < 100; i++) {
      state = reducer(state, { type: 'TICK', ms: 50 });
      expect(state.sliding!.x).toBeGreaterThanOrEqual(0);
      expect(state.sliding!.x).toBeLessThanOrEqual(maxX);
    }
    expect(place(start, 'web').speed).toBeGreaterThan(start.speed);
  });

  it('ignores a drop before picking, and a pick while sliding', () => {
    expect(reducer(start, { type: 'DROP' })).toBe(start);
    const sliding = reducer(start, { type: 'PICK', option: 0 });
    expect(reducer(sliding, { type: 'PICK', option: 1 })).toBe(sliding);
  });
});

describe('offers', () => {
  it('two different kinds, and a way to cover a database whenever one is on top', () => {
    const rng = mulberry32(4);
    for (let i = 0; i < 500; i++) {
      const topKind = Math.floor(rng() * BLOCKS.length);
      const [[a, b]] = offer(Math.floor(rng() * 2 ** 32), topKind);
      expect(a).not.toBe(b);
      if (BLOCKS[topKind].role === 'data') expect([a, b].some((x) => BLOCKS[x].role === 'protect')).toBe(true);
    }
  });

  it('the blocks pass the startup validator, which catches a missing role', () => {
    expect(validateBlocks(BLOCKS)).toEqual([]);
    expect(validateBlocks(BLOCKS.filter((b) => b.role !== 'protect')).join('\n')).toMatch(/no "protect"/);
  });
});
