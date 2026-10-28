import { nextRandom } from '../../shell/rng';
import { CROSSING_CONFIG, type CrossingConfig, type LaneType } from './config';

/** A lane's state: its threats' positions (in rows; they wrap around), and for a router lane, the hacked rows. */
export interface Lane {
  type: LaneType;
  dir: 1 | -1;
  speed: number;
  /** Threat positions, in rows (row 0 is the secure route), from -1 to rows + 1: they go off one edge and come back on the other. */
  threats: number[];
  hacked: number[];
}

export interface CrossingEvent {
  type: 'delivered' | 'hit';
  /** For a hit: what hit it. */
  kind?: LaneType;
  express?: boolean;
  /** Where it happened, in field columns (0 = your laptop) and rows. */
  col: number;
  row: number;
  points: number;
  atMs: number;
}

export interface CrossingState {
  timeMs: number;
  timeLeftMs: number;
  /** The random seed, kept in state so replays are identical. */
  seed: number;
  /** The packet: column 0 is your laptop, the last column the server. */
  packet: { col: number; row: number };
  /** No hop before this game time (the hop cooldown, slower on the secure route). */
  hopReadyMs: number;
  /** A hop asked for during the cooldown: it happens as soon as it can, so quick taps never feel ignored. */
  queued: { dx: number; dy: number } | null;
  lanes: Lane[];
  /** Threat speed multiplier: it rises with every delivery. */
  speedFactor: number;
  tripStartMs: number;
  /** This trip used the secure route. */
  tripSecure: boolean;
  score: number;
  strikes: number;
  delivered: number;
  deliveredSecure: number;
  events: CrossingEvent[];
  over: boolean;
  endReason: 'time' | 'strikes' | null;
}

export type CrossingAction =
  | { type: 'TICK'; ms: number }
  /** One hop: dx and dy are -1, 0 or 1 (right is towards the server; row 0, the secure route, is up). */
  | { type: 'MOVE'; dx: number; dy: number };

/** Field columns: your laptop, the lanes, the server. */
export const columns = (cfg: CrossingConfig = CROSSING_CONFIG) => cfg.lanes.length + 2;
/** Threats wrap around over this many rows, so they go briefly off-screen. */
const wrapLength = (cfg: CrossingConfig) => cfg.rows + 2;
const wrap = (y: number, cfg: CrossingConfig) => {
  const l = wrapLength(cfg);
  return ((((y + 1) % l) + l) % l) - 1;
};

/** Hacked routers for each router lane: distinct rows off the secure route. */
function hackRouters(seed: number, lanes: readonly Lane[], cfg: CrossingConfig): [Lane[], number] {
  let s = seed;
  const next = lanes.map((lane) => {
    if (lane.type !== 'router') return lane;
    const rows = Array.from({ length: cfg.rows - 1 }, (_, i) => i + 1);
    const hacked: number[] = [];
    while (hacked.length < cfg.hackedPerRouterLane && rows.length > 0) {
      let r: number;
      [r, s] = nextRandom(s);
      hacked.push(rows.splice(Math.floor(r * rows.length), 1)[0]);
    }
    return { ...lane, hacked };
  });
  return [next, s];
}

export function initialCrossingState(seed: number, cfg: CrossingConfig = CROSSING_CONFIG): CrossingState {
  let s = seed >>> 0;
  let r: number;
  const lanes: Lane[] = cfg.lanes.map((lane, i) => {
    if (lane.type === 'router') return { type: 'router', dir: 1, speed: 0, threats: [], hacked: [] };
    // Threats spaced about `gap` rows apart, from a random start.
    const threats: number[] = [];
    [r, s] = nextRandom(s);
    let y = r * lane.gap;
    while (y < wrapLength(cfg) - 0.8) {
      threats.push(wrap(y, cfg));
      [r, s] = nextRandom(s);
      y += lane.gap * (0.7 + 0.6 * r);
    }
    return { type: lane.type, dir: i % 2 === 0 ? 1 : -1, speed: lane.speed, threats, hacked: [] };
  });
  const [withRouters, seed2] = hackRouters(s, lanes, cfg);
  return {
    timeMs: 0,
    timeLeftMs: cfg.roundMs,
    seed: seed2,
    packet: { col: 0, row: cfg.startRow },
    hopReadyMs: 0,
    queued: null,
    lanes: withRouters,
    speedFactor: 1,
    tripStartMs: 0,
    tripSecure: false,
    score: 0,
    strikes: 0,
    delivered: 0,
    deliveredSecure: 0,
    events: [],
    over: false,
    endReason: null,
  };
}

/** On the secure route: the top row, between your laptop and the server. */
export function onSecureRoute(col: number, row: number, cfg: CrossingConfig = CROSSING_CONFIG): boolean {
  return row === 0 && col > 0 && col < columns(cfg) - 1;
}

/** What hits the packet where it is now, if anything. The secure route, your laptop and the server are safe. */
export function hitAt(state: CrossingState, cfg: CrossingConfig = CROSSING_CONFIG): LaneType | null {
  const { col, row } = state.packet;
  if (col === 0 || col >= columns(cfg) - 1 || onSecureRoute(col, row, cfg)) return null;
  const lane = state.lanes[col - 1];
  if (lane.type === 'router') return lane.hacked.includes(row) ? 'router' : null;
  const radius = cfg.hitRadius[lane.type];
  return lane.threats.some((y) => Math.abs(y - row) < radius) ? lane.type : null;
}

/**
 * Pure real-time game state machine. MOVE hops the packet one cell (not faster than the hop cooldown, which is
 * slower along the secure route). TICK moves the threats; a threat or hacked router on the packet is a strike and
 * sends a new packet from your laptop. Reaching the server delivers it (with an Express bonus if quick), after
 * which threats speed up and the hacked routers move. The round ends when time runs out or after the last strike.
 */
export function createCrossingReducer(cfg: CrossingConfig) {
  const lastCol = columns(cfg) - 1;

  function respawn(state: CrossingState): CrossingState {
    return {
      ...state,
      packet: { col: 0, row: cfg.startRow },
      hopReadyMs: state.timeMs + cfg.respawnMs,
      queued: null,
      tripStartMs: state.timeMs,
      tripSecure: false,
    };
  }

  function checkHit(state: CrossingState): CrossingState {
    const kind = hitAt(state, cfg);
    if (!kind) return state;
    const strikes = state.strikes + 1;
    const hit: CrossingEvent = { type: 'hit', kind, ...state.packet, points: 0, atMs: state.timeMs };
    const next = respawn({ ...state, strikes, events: [...state.events, hit] });
    return strikes >= cfg.maxStrikes ? { ...next, over: true, endReason: 'strikes' } : next;
  }

  function deliver(state: CrossingState): CrossingState {
    const express = state.timeMs - state.tripStartMs < cfg.scoring.expressMs;
    const points = cfg.scoring.delivered + (express ? cfg.scoring.express : 0);
    const [lanes, seed] = hackRouters(state.seed, state.lanes, cfg);
    return respawn({
      ...state,
      seed,
      lanes,
      score: state.score + points,
      delivered: state.delivered + 1,
      deliveredSecure: state.deliveredSecure + (state.tripSecure ? 1 : 0),
      speedFactor: Math.min(cfg.maxSpeedUp, state.speedFactor * cfg.speedUp),
      events: [...state.events, { type: 'delivered', express, ...state.packet, points, atMs: state.timeMs }],
    });
  }

  /** One hop, now. */
  function hop(state: CrossingState, dx: number, dy: number): CrossingState {
    const col = Math.min(lastCol, Math.max(0, state.packet.col + Math.sign(dx)));
    const row = Math.min(cfg.rows - 1, Math.max(0, state.packet.row + Math.sign(dy)));
    if (col === state.packet.col && row === state.packet.row) return { ...state, queued: null };
    const secure = onSecureRoute(col, row, cfg);
    const moved: CrossingState = {
      ...state,
      packet: { col, row },
      hopReadyMs: state.timeMs + (secure ? cfg.secureHopMs : cfg.hopMs),
      queued: null,
      tripSecure: state.tripSecure || secure,
    };
    return col === lastCol ? deliver(moved) : checkHit(moved);
  }

  return function crossingReducer(state: CrossingState, action: CrossingAction): CrossingState {
    if (state.over) return state;
    switch (action.type) {
      case 'MOVE':
        // Too soon: remember it (the latest one wins) and do it as soon as the cooldown ends.
        if (state.timeMs < state.hopReadyMs) return { ...state, queued: { dx: action.dx, dy: action.dy } };
        return hop(state, action.dx, action.dy);
      case 'TICK': {
        const dt = Math.min(Math.max(0, action.ms), cfg.maxTickMs);
        const lanes = state.lanes.map((lane) =>
          lane.type === 'router'
            ? lane
            : { ...lane, threats: lane.threats.map((y) => wrap(y + (lane.dir * lane.speed * state.speedFactor * dt) / 1000, cfg)) },
        );
        let next: CrossingState = { ...state, timeMs: state.timeMs + dt, timeLeftMs: Math.max(0, state.timeLeftMs - dt), lanes };
        next = checkHit(next);
        if (!next.over && next.queued && next.timeMs >= next.hopReadyMs) next = hop(next, next.queued.dx, next.queued.dy);
        if (!next.over && next.timeLeftMs <= 0) next = { ...next, over: true, endReason: 'time' };
        return next;
      }
    }
  };
}

export const crossingReducer = createCrossingReducer(CROSSING_CONFIG);

/** The hits of a game, one entry per kind, in the order first hit. */
export function hitLessons(events: readonly CrossingEvent[]): { kind: LaneType; count: number }[] {
  const counts = new Map<LaneType, number>();
  for (const e of events) if (e.type === 'hit' && e.kind) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  return [...counts.entries()].map(([kind, count]) => ({ kind, count }));
}
