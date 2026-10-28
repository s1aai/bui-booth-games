import { nextRandom } from '../../shell/rng';
import { PATCH_CONFIG, SEVERITIES, type PatchConfig, type Severity } from './config';
import { SERVERS, VULNERABILITIES, type Vulnerability } from './data';

export interface Vuln {
  id: number;
  server: number;
  severity: Severity;
  /** Index into the vulnerabilities list: its name and explanation. */
  kind: number;
  spawnedMs: number;
  /** Game time when it's exploited if nobody patches it. */
  deadlineMs: number;
}

/** A short-lived message on a server: "+200", "Exploited" or a tap on a server with nothing to patch. */
export interface Flash {
  id: number;
  server: number;
  type: 'patched' | 'exploited' | 'miss';
  atMs: number;
  /** Points won (patched) or lost (miss). */
  points: number;
  /** The vulnerability patched or exploited. */
  severity?: Severity;
}

export interface PatchState {
  /** Game time so far, in ms. Only TICKs move it, so the reducer never reads a clock. */
  timeMs: number;
  /** The random seed for the next spawn: kept in state so the same seed and actions replay the same game. */
  seed: number;
  nextSpawnMs: number;
  /** The current gap between spawns, in ms. */
  intervalMs: number;
  /** Next id for a vulnerability or flash. */
  nextId: number;
  /** Unpatched vulnerabilities on the board, at most one per server. */
  active: Vuln[];
  flashes: Flash[];
  score: number;
  strikes: number;
  /** Why the game ended: an exploited Critical (breach), or too many exploited Highs (strikes). */
  endReason: 'breach' | 'strikes' | null;
  patched: Vuln[];
  exploited: Vuln[];
  /** Taps on servers with nothing to patch. */
  misses: number;
  over: boolean;
}

export type PatchAction =
  /** Game time passed, in ms (from requestAnimationFrame). */
  | { type: 'TICK'; ms: number }
  /** A tap on a server. */
  | { type: 'PATCH'; server: number };

export function initialPatchState(seed: number, cfg: PatchConfig = PATCH_CONFIG): PatchState {
  return {
    timeMs: 0,
    seed: seed >>> 0,
    nextSpawnMs: cfg.spawn.firstDelayMs,
    intervalMs: cfg.spawn.startIntervalMs,
    nextId: 1,
    active: [],
    flashes: [],
    score: 0,
    strikes: 0,
    endReason: null,
    patched: [],
    exploited: [],
    misses: 0,
    over: false,
  };
}

/** Picks an index for `r` in [0, 1), in proportion to the weights. */
export function weightedIndex(weights: readonly number[], r: number): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let x = r * total;
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}

/** How much of a vulnerability's time is left, from 1 (just appeared) to 0 (exploited). */
export function timeLeft(vuln: Vuln, timeMs: number): number {
  return Math.max(0, Math.min(1, (vuln.deadlineMs - timeMs) / (vuln.deadlineMs - vuln.spawnedMs)));
}

/**
 * Pure real-time game state machine. TICK moves game time on: overdue vulnerabilities are exploited (a Critical ends
 * the game at once, a High is a strike, a Low costs nothing: cfg.severities' onExploit), and new ones spawn on free
 * servers, faster each time. PATCH fixes a server's vulnerability, or costs cfg.missPenalty if it had none. An
 * exploited Critical, or the last strike, ends the game.
 */
export function createPatchReducer(
  cfg: PatchConfig,
  vulnerabilities: readonly Vulnerability[] = VULNERABILITIES,
  serverCount: number = SERVERS.length,
) {
  const kindsBySeverity = Object.fromEntries(
    SEVERITIES.map((s) => [s, vulnerabilities.flatMap((v, i) => (v.severity === s ? [i] : []))]),
  ) as Record<Severity, number[]>;
  const weights = SEVERITIES.map((s) => cfg.severities[s].weight);

  function tick(state: PatchState, ms: number): PatchState {
    const timeMs = state.timeMs + Math.min(Math.max(0, ms), cfg.maxTickMs);
    let { seed, nextSpawnMs, intervalMs, nextId, strikes } = state;
    let breached = false;
    const active: Vuln[] = [];
    const exploited = [...state.exploited];
    const flashes = state.flashes.filter((f) => f.atMs + cfg.flashMs > timeMs);

    // Exploits first: anything past its deadline.
    for (const vuln of state.active) {
      if (vuln.deadlineMs > timeMs) {
        active.push(vuln);
        continue;
      }
      exploited.push(vuln);
      const effect = cfg.severities[vuln.severity].onExploit;
      if (effect === 'strike') strikes++;
      if (effect === 'breach') breached = true;
      flashes.push({ id: nextId++, server: vuln.server, type: 'exploited', atMs: vuln.deadlineMs, points: 0, severity: vuln.severity });
    }
    const over = breached || strikes >= cfg.maxStrikes;
    const endReason = breached ? 'breach' : over ? 'strikes' : null;

    // Then spawns, each at its own moment, on a random free server: no vulnerability, and no message still showing
    // (a new one would appear under it). If every server is busy, that one is skipped.
    while (!over && nextSpawnMs <= timeMs) {
      const free = Array.from({ length: serverCount }, (_, i) => i).filter(
        (i) => !active.some((v) => v.server === i) && !flashes.some((f) => f.server === i),
      );
      if (free.length > 0) {
        let r: number;
        [r, seed] = nextRandom(seed);
        const severity = SEVERITIES[weightedIndex(weights, r)];
        [r, seed] = nextRandom(seed);
        const server = free[Math.floor(r * free.length)];
        [r, seed] = nextRandom(seed);
        const kinds = kindsBySeverity[severity];
        const kind = kinds[Math.floor(r * kinds.length)];
        active.push({
          id: nextId++,
          server,
          severity,
          kind,
          spawnedMs: nextSpawnMs,
          deadlineMs: nextSpawnMs + cfg.severities[severity].deadlineMs * 0.5 ** (nextSpawnMs / cfg.deadlineHalfLifeMs),
        });
      }
      intervalMs = cfg.spawn.startIntervalMs * 0.5 ** (nextSpawnMs / cfg.spawn.halfLifeMs);
      nextSpawnMs += intervalMs;
    }

    return { ...state, timeMs, seed, nextSpawnMs, intervalMs, nextId, active, exploited, flashes, strikes, over, endReason };
  }

  function patch(state: PatchState, server: number): PatchState {
    const vuln = state.active.find((v) => v.server === server);
    const flash = (type: Flash['type'], points: number): Flash => ({
      id: state.nextId,
      server,
      type,
      atMs: state.timeMs,
      points,
      severity: vuln?.severity,
    });
    // Only the latest message on each server shows, so a new one replaces the old.
    const flashes = state.flashes.filter((f) => f.server !== server);
    if (!vuln) {
      return {
        ...state,
        nextId: state.nextId + 1,
        score: Math.max(0, state.score - cfg.missPenalty),
        misses: state.misses + 1,
        flashes: [...flashes, flash('miss', cfg.missPenalty)],
      };
    }
    const points = cfg.severities[vuln.severity].points;
    return {
      ...state,
      nextId: state.nextId + 1,
      active: state.active.filter((v) => v !== vuln),
      patched: [...state.patched, vuln],
      score: state.score + points,
      flashes: [...flashes, flash('patched', points)],
    };
  }

  return function patchReducer(state: PatchState, action: PatchAction): PatchState {
    if (state.over) return state;
    switch (action.type) {
      case 'TICK':
        return tick(state, action.ms);
      case 'PATCH':
        return action.server >= 0 && action.server < serverCount ? patch(state, action.server) : state;
    }
  };
}

export const patchReducer = createPatchReducer(PATCH_CONFIG);

export interface ExploitLesson {
  severity: Severity;
  vulnerability: Vulnerability;
  /** Where it was exploited, in board order, each server once. */
  servers: string[];
}

/** What got exploited, one entry per kind of vulnerability, the most severe first. */
export function exploitLessons(
  exploited: readonly Vuln[],
  vulnerabilities: readonly Vulnerability[] = VULNERABILITIES,
  servers: readonly string[] = SERVERS,
): ExploitLesson[] {
  const byKind = new Map<number, Set<number>>();
  for (const vuln of exploited) byKind.set(vuln.kind, (byKind.get(vuln.kind) ?? new Set()).add(vuln.server));
  return [...byKind.entries()]
    .map(([kind, onServers]) => ({
      severity: vulnerabilities[kind].severity,
      vulnerability: vulnerabilities[kind],
      servers: [...onServers].sort((a, b) => a - b).map((i) => servers[i]),
    }))
    .sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));
}
