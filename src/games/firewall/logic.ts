import { nextRandom } from '../../shell/rng';
import { FIREWALL_CONFIG, type FirewallConfig } from './config';
import { FILES, type FileItem } from './data';

/** A file on its way down. */
export interface Drop {
  id: number;
  /** Index into the file list. */
  file: number;
  lane: number;
  spawnedMs: number;
  /** Game time when it reaches your network. */
  landMs: number;
}

/**
 * What happened to a file: blocked (dangerous, tapped), wrongBlock (safe, tapped), breach (dangerous, landed) or
 * delivered (safe, landed). A wrongBlock or breach is a strike.
 */
export interface Outcome {
  id: number;
  file: number;
  lane: number;
  type: 'blocked' | 'wrongBlock' | 'breach' | 'delivered';
  atMs: number;
  /** How far down it was (0 top, 1 landed), for where "Blocked!" shows. */
  progress: number;
  points: number;
}

export interface FirewallState {
  /** Game time so far, in ms. Only TICKs move it, so the reducer never reads a clock. */
  timeMs: number;
  /** The random seed for the next spawn, kept in state so the same seed and actions replay the same game. */
  seed: number;
  nextSpawnMs: number;
  intervalMs: number;
  fallMs: number;
  /** Files spawned so far: sets the level. */
  spawned: number;
  nextId: number;
  drops: Drop[];
  /** Every outcome this game, in order. */
  outcomes: Outcome[];
  score: number;
  /** Good calls in a row. */
  streak: number;
  bestStreak: number;
  strikes: number;
  over: boolean;
}

export type FirewallAction =
  /** Game time passed, in ms (from requestAnimationFrame). */
  | { type: 'TICK'; ms: number }
  /** A tap on a falling file. */
  | { type: 'BLOCK'; id: number };

export function initialFirewallState(seed: number, cfg: FirewallConfig = FIREWALL_CONFIG): FirewallState {
  return {
    timeMs: 0,
    seed: seed >>> 0,
    nextSpawnMs: cfg.spawn.firstDelayMs,
    intervalMs: cfg.spawn.startIntervalMs,
    fallMs: cfg.fall.startMs,
    spawned: 0,
    nextId: 1,
    drops: [],
    outcomes: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    strikes: 0,
    over: false,
  };
}

/** How far a file has fallen, from 0 (top) to 1 (reached your network). */
export function progress(drop: Drop, timeMs: number): number {
  return Math.max(0, Math.min(1, (timeMs - drop.spawnedMs) / (drop.landMs - drop.spawnedMs)));
}

/** The level for the next file: 1 at the start, up to 3. Files of that difficulty or easier can come. */
export function levelFor(spawned: number, cfg: FirewallConfig = FIREWALL_CONFIG): number {
  return Math.min(3, 1 + Math.floor(spawned / cfg.spawn.filesPerLevel));
}

/** Multiplier for a good call after `streak` good ones in a row: 1x, 1.1x, 1.2x ... capped. */
export function streakMultiplier(streak: number, cfg: FirewallConfig = FIREWALL_CONFIG): number {
  return Math.min(cfg.scoring.streakCap, 1 + cfg.scoring.streakStep * streak);
}

/**
 * Pure real-time game state machine. TICK moves game time on: files that reach the bottom land (a strike if
 * dangerous, points if safe), and new ones spawn, faster and faster. BLOCK stops a file: points if it was dangerous,
 * a strike if it was safe. Three strikes end the game.
 */
export function createFirewallReducer(cfg: FirewallConfig, files: readonly FileItem[] = FILES) {
  /** Scores an outcome and updates the streak and strikes. */
  function settle(state: FirewallState, drop: Drop, type: Outcome['type'], atMs: number): FirewallState {
    const good = type === 'blocked' || type === 'delivered';
    const base = type === 'blocked' ? cfg.scoring.blocked : type === 'delivered' ? cfg.scoring.delivered : 0;
    const points = good ? Math.round(base * streakMultiplier(state.streak, cfg)) : 0;
    const streak = good ? state.streak + 1 : 0;
    const strikes = state.strikes + (good ? 0 : 1);
    const outcome: Outcome = { id: drop.id, file: drop.file, lane: drop.lane, type, atMs, progress: progress(drop, atMs), points };
    return {
      ...state,
      score: state.score + points,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      strikes,
      over: strikes >= cfg.maxStrikes,
      outcomes: [...state.outcomes, outcome],
    };
  }

  function spawn(state: FirewallState, atMs: number): FirewallState {
    let { seed } = state;
    let r: number;
    // Dangerous or safe, then a file of that kind up to the current level, not already on screen.
    [r, seed] = nextRandom(seed);
    const dangerous = r < cfg.spawn.dangerousShare;
    const level = levelFor(state.spawned, cfg);
    const onScreen = new Set(state.drops.map((d) => d.file));
    const candidates = files.flatMap((f, i) => (f.dangerous === dangerous && f.difficulty <= level ? [i] : []));
    const fresh = candidates.filter((i) => !onScreen.has(i));
    const pool = fresh.length > 0 ? fresh : candidates;
    [r, seed] = nextRandom(seed);
    const file = pool[Math.floor(r * pool.length)];

    // A column whose last file has fallen far enough; if none has, the one whose last file is furthest down.
    const lastInLane = (lane: number) =>
      Math.min(1, ...state.drops.filter((d) => d.lane === lane).map((d) => progress(d, atMs)));
    const lanes = Array.from({ length: cfg.lanes }, (_, i) => i);
    const open = lanes.filter((lane) => lastInLane(lane) >= cfg.spawn.laneGap);
    [r, seed] = nextRandom(seed);
    const lane =
      open.length > 0
        ? open[Math.floor(r * open.length)]
        : lanes.reduce((best, l) => (lastInLane(l) > lastInLane(best) ? l : best), 0);

    const drop: Drop = { id: state.nextId, file, lane, spawnedMs: atMs, landMs: atMs + state.fallMs };
    const intervalMs = Math.max(cfg.spawn.minIntervalMs, state.intervalMs * cfg.spawn.decay);
    return {
      ...state,
      seed,
      nextId: state.nextId + 1,
      spawned: state.spawned + 1,
      drops: [...state.drops, drop],
      intervalMs,
      fallMs: Math.max(cfg.fall.minMs, state.fallMs * cfg.fall.decay),
      nextSpawnMs: atMs + intervalMs,
    };
  }

  function tick(state: FirewallState, ms: number): FirewallState {
    const timeMs = state.timeMs + Math.min(Math.max(0, ms), cfg.maxTickMs);
    let next: FirewallState = { ...state, timeMs };
    // Landings first, in the order they land.
    const landed = next.drops.filter((d) => d.landMs <= timeMs).sort((a, b) => a.landMs - b.landMs);
    next = { ...next, drops: next.drops.filter((d) => d.landMs > timeMs) };
    for (const drop of landed) {
      if (next.over) break;
      next = settle(next, drop, files[drop.file].dangerous ? 'breach' : 'delivered', drop.landMs);
    }
    // Then spawns, each at its own moment.
    while (!next.over && next.nextSpawnMs <= timeMs) next = spawn(next, next.nextSpawnMs);
    return next;
  }

  return function firewallReducer(state: FirewallState, action: FirewallAction): FirewallState {
    if (state.over) return state;
    switch (action.type) {
      case 'TICK':
        return tick(state, action.ms);
      case 'BLOCK': {
        const drop = state.drops.find((d) => d.id === action.id);
        if (!drop) return state;
        const next = { ...state, drops: state.drops.filter((d) => d !== drop) };
        return settle(next, drop, files[drop.file].dangerous ? 'blocked' : 'wrongBlock', state.timeMs);
      }
    }
  };
}

export const firewallReducer = createFirewallReducer(FIREWALL_CONFIG);

export interface MistakeLesson {
  file: FileItem;
  type: 'breach' | 'wrongBlock';
  /** How many times this file was missed. */
  count: number;
}

/** The mistakes of a game, one entry per file, in the order they first happened. */
export function mistakeLessons(outcomes: readonly Outcome[], files: readonly FileItem[] = FILES): MistakeLesson[] {
  const byFile = new Map<number, MistakeLesson>();
  for (const o of outcomes) {
    if (o.type !== 'breach' && o.type !== 'wrongBlock') continue;
    const seen = byFile.get(o.file);
    if (seen) seen.count++;
    else byFile.set(o.file, { file: files[o.file], type: o.type, count: 1 });
  }
  return [...byFile.values()];
}
