import { mulberry32, nextRandom, type Rng } from '../../shell/rng';
import { SEGMENT_CONFIG, type RoundConfig, type SegmentConfig } from './config';
import { LINK_KINDS } from './data';

/** A square of the grid: row * size + column. */
export type Cell = number;

export interface Link {
  /** Index into LINK_KINDS: the device, the network and the colour. */
  kind: number;
  /** The device's square, then the network's. */
  ends: [Cell, Cell];
}

export interface Puzzle {
  size: number;
  links: Link[];
  /** One way to solve it: a path per link, from its device to its network, together covering every square. */
  solution: Cell[][];
}

/** The squares next to this one (up, down, left, right). */
export function neighbours(cell: Cell, size: number): Cell[] {
  const r = Math.floor(cell / size);
  const c = cell % size;
  const out: Cell[] = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
}

export const isAdjacent = (a: Cell, b: Cell, size: number) => neighbours(a, size).includes(b);

/**
 * A random path through every square: a snake to start with, then reshaped many times by "backbite" moves (join an
 * end to a square next to it, and break the loop that makes). Any such path is a valid solution to a puzzle.
 */
function randomFullPath(size: number, moves: number, rng: Rng): Cell[] {
  let path: Cell[] = [];
  for (let r = 0; r < size; r++) for (let i = 0; i < size; i++) path.push(r * size + (r % 2 === 0 ? i : size - 1 - i));
  for (let m = 0; m < moves; m++) {
    if (rng() < 0.5) path.reverse(); // work on either end
    const options = neighbours(path[0], size).filter((n) => n !== path[1]);
    const i = path.indexOf(options[Math.floor(rng() * options.length)]);
    // Joining path[0] to path[i] makes a loop of path[0..i]: break it between path[i-1] and path[i].
    path = [...path.slice(0, i).reverse(), ...path.slice(i)];
  }
  return path;
}

/** Cuts a path into `count` pieces of at least `min` squares, of random lengths. */
function cutPath(path: Cell[], count: number, min: number, rng: Rng): Cell[][] {
  const lengths: number[] = Array(count).fill(min);
  for (let left = path.length - min * count; left > 0; left--) lengths[Math.floor(rng() * count)]++;
  let at = 0;
  return lengths.map((length) => path.slice(at, (at += length)));
}

/**
 * A puzzle: a random path through every square, cut into one piece per link. Each piece's ends are a link's device
 * and network, so the pieces are a solution by construction (the player may find another). Pieces whose ends are
 * next to each other are avoided (they'd connect trivially), with a bounded number of tries.
 */
export function makePuzzle(
  round: RoundConfig,
  seed: number,
  cfg: SegmentConfig = SEGMENT_CONFIG,
  kindCount: number = LINK_KINDS.length,
): Puzzle {
  const rng = mulberry32(seed);
  const { size } = round;
  let pieces: Cell[][] = [];
  for (let attempt = 0; attempt < 200; attempt++) {
    const path = randomFullPath(size, cfg.shufflePerCell * size * size, rng);
    pieces = cutPath(path, round.links, cfg.minLinkLength, rng);
    if (pieces.every((p) => !isAdjacent(p[0], p[p.length - 1], size))) break;
  }
  // Each piece gets a different kind of link, and a random way round (which end is the device).
  const kinds = Array.from({ length: kindCount }, (_, i) => i)
    .map((kind) => ({ kind, key: rng() }))
    .sort((a, b) => a.key - b.key)
    .map(({ kind }) => kind);
  const solution = pieces.map((p) => (rng() < 0.5 ? p : [...p].reverse()));
  return {
    size,
    links: solution.map((p, i) => ({ kind: kinds[i], ends: [p[0], p[p.length - 1]] })),
    solution,
  };
}

export interface SegmentState {
  timeMs: number;
  /** The game's clock. It waits while a solved puzzle is showing. */
  timeLeftMs: number;
  /** The seed for the next puzzle: kept in state so the same seed and actions replay the same game. */
  seed: number;
  /** Which puzzle this is (0 = the first), for cfg.rounds. */
  round: number;
  puzzle: Puzzle;
  /** The line drawn for each link so far, starting at one of its ends. Empty = not started. */
  paths: Cell[][];
  /** The link being drawn (a finger is down), or null. */
  drawing: number | null;
  score: number;
  /** Puzzles solved, and the biggest grid solved (0 = none). */
  solved: number;
  largest: number;
  /** Kinds of link that appeared, and those connected in a solved puzzle: for the lessons. */
  kindsSeen: number[];
  kindsDone: number[];
  /** When the current puzzle was solved: the next follows after a pause. */
  solvedAtMs: number | null;
  over: boolean;
}

export type SegmentAction =
  /** A finger down on a square: an end starts that link afresh; a square on a line carries on from there. */
  | { type: 'START_DRAW'; cell: Cell }
  /** The finger is over this square now: the line follows it, square by square. */
  | { type: 'DRAW'; cell: Cell }
  | { type: 'END_DRAW' }
  | { type: 'TICK'; ms: number };

export function roundFor(index: number, cfg: SegmentConfig = SEGMENT_CONFIG): RoundConfig {
  return cfg.rounds[Math.min(index, cfg.rounds.length - 1)];
}

function withPuzzle(state: SegmentState, round: number, cfg: SegmentConfig): SegmentState {
  const puzzle = makePuzzle(roundFor(round, cfg), state.seed, cfg);
  const kinds = puzzle.links.map((l) => l.kind);
  return {
    ...state,
    seed: nextRandom(state.seed)[1],
    round,
    puzzle,
    paths: puzzle.links.map(() => []),
    drawing: null,
    solvedAtMs: null,
    kindsSeen: [...state.kindsSeen, ...kinds.filter((k) => !state.kindsSeen.includes(k))],
  };
}

export function initialSegmentState(seed: number, cfg: SegmentConfig = SEGMENT_CONFIG): SegmentState {
  const blank: SegmentState = {
    timeMs: 0,
    timeLeftMs: cfg.roundMs,
    seed: seed >>> 0,
    round: 0,
    puzzle: { size: 0, links: [], solution: [] },
    paths: [],
    drawing: null,
    score: 0,
    solved: 0,
    largest: 0,
    kindsSeen: [],
    kindsDone: [],
    solvedAtMs: null,
    over: false,
  };
  return withPuzzle(blank, 0, cfg);
}

/** Whether this link's line runs from one of its ends to the other. */
export function isConnected(path: readonly Cell[], link: Link): boolean {
  return path.length >= 2 && link.ends.includes(path[0]) && link.ends.includes(path[path.length - 1]);
}

/** Every link connected, and every square used. */
export function isSolved(state: SegmentState): boolean {
  const { puzzle, paths } = state;
  const used = paths.reduce((n, p) => n + p.length, 0);
  return puzzle.links.every((link, i) => isConnected(paths[i], link)) && used === puzzle.size * puzzle.size;
}

/** The link with an end on this square, or -1. */
export function endAt(puzzle: Puzzle, cell: Cell): number {
  return puzzle.links.findIndex((l) => l.ends.includes(cell));
}

/**
 * Pure game state machine, like Flow Free: draw a line from each device to its network. Lines can't cross (drawing
 * over another line cuts it back), and a puzzle is solved when every link is connected and every square used. TICK
 * runs the clock, which waits while a solved puzzle shows; then the next, bigger puzzle comes, until time runs out.
 */
export function createSegmentReducer(cfg: SegmentConfig) {
  /** Whether the line being drawn would cut another line, or be stopped by another link's end, on this square. */
  function inTheWay(state: SegmentState, cell: Cell): boolean {
    const f = state.drawing!;
    const end = endAt(state.puzzle, cell);
    return (end >= 0 && end !== f) || state.paths.some((p, i) => i !== f && p.includes(cell));
  }

  /** One step of the line being drawn onto a square next to its head, or null if that square is blocked. */
  function step(state: SegmentState, next: Cell): SegmentState | null {
    const f = state.drawing!;
    const { puzzle } = state;
    const path = state.paths[f];
    const paths = [...state.paths];
    const back = path.indexOf(next);
    if (back >= 0) {
      paths[f] = path.slice(0, back + 1); // back along its own line
      return { ...state, paths };
    }
    if (isConnected(path, puzzle.links[f])) return null; // it has reached its other end
    const end = endAt(puzzle, next);
    if (end >= 0 && end !== f) return null; // another link's device or network
    const other = paths.findIndex((p) => p.includes(next));
    if (other >= 0) paths[other] = paths[other].slice(0, paths[other].indexOf(next)); // cut the other line back
    paths[f] = [...path, next];
    return { ...state, paths };
  }

  function draw(state: SegmentState, target: Cell): SegmentState {
    const { size } = state.puzzle;
    let s = state;
    for (let guard = 0; guard < size * size; guard++) {
      const path = s.paths[s.drawing!];
      const head = path[path.length - 1];
      if (head === target) break;
      // Towards the finger, along the longer way first. When a quick move skipped a corner, either way round it gets
      // there: take the one that doesn't cut through another line or hit another link's end.
      const dr = Math.floor(target / size) - Math.floor(head / size);
      const dc = (target % size) - (head % size);
      const vertical = head + Math.sign(dr) * size;
      const across = head + Math.sign(dc);
      let next = Math.abs(dr) >= Math.abs(dc) ? vertical : across;
      if (dr !== 0 && dc !== 0) {
        const other = next === vertical ? across : vertical;
        if (inTheWay(s, next) && !inTheWay(s, other)) next = other;
      }
      const moved = step(s, next);
      if (!moved) break;
      s = moved;
    }
    if (s === state || !isSolved(s)) return s;
    const { points, size: solvedSize } = roundFor(s.round, cfg);
    const kinds = s.puzzle.links.map((l) => l.kind);
    return {
      ...s,
      drawing: null,
      score: s.score + points,
      solved: s.solved + 1,
      largest: Math.max(s.largest, solvedSize),
      kindsDone: [...s.kindsDone, ...kinds.filter((k) => !s.kindsDone.includes(k))],
      solvedAtMs: s.timeMs,
    };
  }

  return function segmentReducer(state: SegmentState, action: SegmentAction): SegmentState {
    if (state.over) return state;
    switch (action.type) {
      case 'START_DRAW': {
        if (state.solvedAtMs !== null) return state;
        const end = endAt(state.puzzle, action.cell);
        if (end >= 0) {
          const paths = [...state.paths];
          paths[end] = [action.cell];
          return { ...state, paths, drawing: end };
        }
        const on = state.paths.findIndex((p) => p.includes(action.cell));
        if (on < 0) return state;
        const paths = [...state.paths];
        paths[on] = paths[on].slice(0, paths[on].indexOf(action.cell) + 1);
        return { ...state, paths, drawing: on };
      }
      case 'DRAW':
        if (state.drawing === null || state.solvedAtMs !== null) return state;
        if (action.cell < 0 || action.cell >= state.puzzle.size * state.puzzle.size) return state;
        return draw(state, action.cell);
      case 'END_DRAW':
        return state.drawing === null ? state : { ...state, drawing: null };
      case 'TICK': {
        const ms = Math.min(Math.max(0, action.ms), cfg.maxTickMs);
        const s = { ...state, timeMs: state.timeMs + ms };
        if (s.solvedAtMs !== null) {
          return s.timeMs - s.solvedAtMs >= cfg.solvedPauseMs ? withPuzzle(s, s.round + 1, cfg) : s;
        }
        const timeLeftMs = s.timeLeftMs - ms;
        return timeLeftMs > 0 ? { ...s, timeLeftMs } : { ...s, timeLeftMs: 0, drawing: null, over: true };
      }
    }
  };
}

export const segmentReducer = createSegmentReducer(SEGMENT_CONFIG);
