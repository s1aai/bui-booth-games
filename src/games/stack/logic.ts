import { nextRandom } from '../../shell/rng';
import { STACK_CONFIG, type StackConfig } from './config';
import { BLOCKS, type BlockKind } from './data';

/** A block in the tower. kind -1 is the foundation ("Your company"). */
export interface Block {
  kind: number;
  x: number;
  width: number;
  /** An exposed database: shown cracked, and listed in the lessons. */
  exposed: boolean;
}

/** Something that happened when a block was placed: for the popups and the lessons. */
export interface StackEvent {
  type: 'perfect' | 'protected' | 'depth' | 'exposed' | 'collapse';
  /** The block placed, and the one it went on (-1: the foundation). */
  kind: number;
  below: number;
  /** The tower level it happened at (1 = the first block on the foundation). */
  level: number;
  points: number;
  atMs: number;
}

export interface StackState {
  /** pick (choose one of two blocks) -> slide (tap to drop) -> pick ..., until the tower collapses or is breached. */
  phase: 'pick' | 'slide' | 'over';
  /** Game time so far, in ms. Only TICKs move it. */
  timeMs: number;
  /** The random seed for the next pair of offers, kept in state so replays are identical. */
  seed: number;
  /** The tower, the foundation first. */
  blocks: Block[];
  /** The two block kinds offered. */
  options: [number, number];
  /** The block sliding above the tower. */
  sliding: { kind: number; x: number; dir: 1 | -1 } | null;
  speed: number;
  /** The last sliced-off piece, falling. */
  cut: { kind: number; x: number; width: number; level: number; atMs: number } | null;
  score: number;
  strikes: number;
  events: StackEvent[];
  endReason: 'collapse' | 'strikes' | null;
}

export type StackAction =
  /** Choose one of the two offered blocks. */
  | { type: 'PICK'; option: 0 | 1 }
  /** Drop the sliding block. */
  | { type: 'DROP' }
  /** Time passed, in ms (from requestAnimationFrame). */
  | { type: 'TICK'; ms: number };

export const top = (state: StackState): Block => state.blocks[state.blocks.length - 1];

/** Picks a kind in proportion to the weights. */
function weighted(r: number, kinds: readonly BlockKind[], among: readonly number[]): number {
  const total = among.reduce((sum, i) => sum + kinds[i].weight, 0);
  let x = r * total;
  for (const i of among) {
    x -= kinds[i].weight;
    if (x < 0) return i;
  }
  return among[among.length - 1];
}

/**
 * The next two offers: two different kinds, by weight. If a database is on top, at least one of them protects it,
 * so leaving it exposed is always the player's choice.
 */
export function offer(seed: number, topKind: number, kinds: readonly BlockKind[] = BLOCKS): [[number, number], number] {
  const all = kinds.map((_, i) => i);
  let s = seed;
  let r: number;
  [r, s] = nextRandom(s);
  let first = weighted(r, kinds, all);
  [r, s] = nextRandom(s);
  let second = weighted(r, kinds, all.filter((i) => i !== first));
  const needsCover = topKind >= 0 && kinds[topKind].role === 'data';
  if (needsCover && kinds[first].role !== 'protect' && kinds[second].role !== 'protect') {
    const protect = all.filter((i) => kinds[i].role === 'protect');
    [r, s] = nextRandom(s);
    second = weighted(r, kinds, protect);
  }
  // Put them in a random order, so the safe choice isn't always on the same side.
  [r, s] = nextRandom(s);
  if (r < 0.5) [first, second] = [second, first];
  return [[first, second], s];
}

export function initialStackState(seed: number, cfg: StackConfig = STACK_CONFIG): StackState {
  const { width, startWidth } = cfg.view;
  const [options, s] = offer(seed >>> 0, -1);
  return {
    phase: 'pick',
    timeMs: 0,
    seed: s,
    blocks: [{ kind: -1, x: (width - startWidth) / 2, width: startWidth, exposed: false }],
    options,
    sliding: null,
    speed: cfg.slide.startSpeed,
    cut: null,
    score: 0,
    strikes: 0,
    events: [],
    endReason: null,
  };
}

/**
 * What placing `kind` on `below` means, by the blocks' roles: a database left without a protect block on it is
 * exposed; a protect block on a database or web server is protected; two different protect blocks are defence in
 * depth.
 */
export function judge(kind: number, below: number, kinds: readonly BlockKind[] = BLOCKS): 'exposed' | 'protected' | 'depth' | null {
  if (below < 0) return null;
  const placed = kinds[kind];
  const under = kinds[below];
  if (under.role === 'data' && placed.role !== 'protect') return 'exposed';
  if (placed.role === 'protect' && under.role !== 'protect') return 'protected';
  if (placed.role === 'protect' && under.role === 'protect' && placed.id !== under.id) return 'depth';
  return null;
}

/**
 * Pure game state machine: PICK a block, it slides; DROP it on the tower. The overhang is sliced off (a drop
 * within perfectTolerance snaps in whole); missing the tower entirely collapses it. Then the security rules
 * (judge) score bonuses or strikes. The slide gets faster with every block.
 */
export function createStackReducer(cfg: StackConfig, kinds: readonly BlockKind[] = BLOCKS) {
  function drop(state: StackState): StackState {
    if (!state.sliding) return state;
    const below = top(state);
    const { kind } = state.sliding;
    const level = state.blocks.length;
    let x = state.sliding.x;
    const width = below.width;
    const offset = x - below.x;
    const events: StackEvent[] = [];
    const at = { kind, below: below.kind, level, atMs: state.timeMs };

    // Stability: line it up, or lose what hangs over the edge.
    if (Math.abs(offset) >= width) {
      return {
        ...state,
        phase: 'over',
        sliding: null,
        cut: { kind, x, width, level, atMs: state.timeMs },
        events: [...state.events, { type: 'collapse', points: 0, ...at }],
        endReason: 'collapse',
      };
    }
    let placedWidth = width;
    let cut: StackState['cut'] = null;
    if (Math.abs(offset) <= cfg.perfectTolerance) {
      x = below.x;
      events.push({ type: 'perfect', points: cfg.bonus.perfect, ...at });
    } else {
      placedWidth = width - Math.abs(offset);
      const cutX = offset > 0 ? below.x + width : x;
      cut = { kind, x: cutX, width: Math.abs(offset), level, atMs: state.timeMs };
      x = Math.max(x, below.x);
    }

    // Security: what it was placed on.
    const verdict = judge(kind, below.kind, kinds);
    if (verdict === 'protected') events.push({ type: 'protected', points: cfg.bonus.protected, ...at });
    if (verdict === 'depth') events.push({ type: 'depth', points: cfg.bonus.defenceInDepth, ...at });
    if (verdict === 'exposed') events.push({ type: 'exposed', points: 0, ...at });

    const blocks = state.blocks.map((b, i) => (i === state.blocks.length - 1 && verdict === 'exposed' ? { ...b, exposed: true } : b));
    blocks.push({ kind, x, width: placedWidth, exposed: false });
    const strikes = state.strikes + (verdict === 'exposed' ? 1 : 0);
    const points = kinds[kind].points + events.reduce((sum, e) => sum + e.points, 0);
    const [options, seed] = offer(state.seed, kind, kinds);
    const breached = strikes >= cfg.maxStrikes;
    return {
      ...state,
      phase: breached ? 'over' : 'pick',
      seed,
      blocks,
      options,
      sliding: null,
      speed: Math.min(cfg.slide.maxSpeed, state.speed + cfg.slide.speedStep),
      cut,
      score: state.score + points,
      strikes,
      events: [...state.events, ...events],
      endReason: breached ? 'strikes' : null,
    };
  }

  return function stackReducer(state: StackState, action: StackAction): StackState {
    if (state.phase === 'over') return state;
    switch (action.type) {
      case 'PICK':
        if (state.phase !== 'pick') return state;
        // It slides in from the left edge.
        return { ...state, phase: 'slide', sliding: { kind: state.options[action.option], x: 0, dir: 1 } };
      case 'DROP':
        return state.phase === 'slide' ? drop(state) : state;
      case 'TICK': {
        const dt = Math.min(Math.max(0, action.ms), cfg.maxTickMs);
        const timeMs = state.timeMs + dt;
        if (!state.sliding) return { ...state, timeMs };
        // Back and forth between the edges of the play area.
        const maxX = cfg.view.width - top(state).width;
        let x = state.sliding.x + state.sliding.dir * ((state.speed * dt) / 1000);
        let dir = state.sliding.dir;
        if (x >= maxX) [x, dir] = [maxX - (x - maxX), -1];
        if (x <= 0) [x, dir] = [-x, 1];
        return { ...state, timeMs, sliding: { ...state.sliding, x: Math.min(Math.max(x, 0), maxX), dir } };
      }
    }
  };
}

export const stackReducer = createStackReducer(STACK_CONFIG);

/** The exposed databases of a game, for the lessons: what was put on each. */
export function exposures(events: readonly StackEvent[]): StackEvent[] {
  return events.filter((e) => e.type === 'exposed');
}
