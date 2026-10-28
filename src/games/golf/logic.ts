import { GOLF_CONFIG, type GolfConfig } from './config';
import { HOLES, type Hole, type Rect } from './data';

export interface GolfEvent {
  type: 'intercepted' | 'tunnel' | 'sunk' | 'gaveUp';
  hole: number;
  x: number;
  y: number;
  atMs: number;
  /** For sunk / gaveUp: the hole's strokes and points. */
  strokes?: number;
  points?: number;
}

export interface GolfState {
  timeMs: number;
  /** Which hole (index into HOLES). */
  hole: number;
  ball: { x: number; y: number; vx: number; vy: number };
  moving: boolean;
  /** Where the last shot was taken from: an intercepted ball goes back there. */
  shotFrom: { x: number; y: number };
  /** Strokes on this hole, penalties included. */
  strokes: number;
  /** Strokes for each finished hole. */
  card: number[];
  score: number;
  /** When the ball dropped (or the hole was given up): the next hole starts after a pause. */
  sunkAtMs: number | null;
  /** A tunnel just used: it can't be entered again until the ball has left its mouth. */
  inTunnel: boolean;
  events: GolfEvent[];
  over: boolean;
}

export type GolfAction =
  /** Hit the ball: angle in radians (0 = right), power from 0 to 1. Only when it has stopped. */
  | { type: 'SHOOT'; angle: number; power: number }
  | { type: 'TICK'; ms: number };

function startHole(state: GolfState, index: number, holes: readonly Hole[]): GolfState {
  const { start } = holes[index];
  return {
    ...state,
    hole: index,
    ball: { x: start.x, y: start.y, vx: 0, vy: 0 },
    moving: false,
    shotFrom: { ...start },
    strokes: 0,
    sunkAtMs: null,
    inTunnel: false,
  };
}

export function initialGolfState(holes: readonly Hole[] = HOLES): GolfState {
  const blank: GolfState = {
    timeMs: 0,
    hole: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    moving: false,
    shotFrom: { x: 0, y: 0 },
    strokes: 0,
    card: [],
    score: 0,
    sunkAtMs: null,
    inTunnel: false,
    events: [],
    over: false,
  };
  return startHole(blank, 0, holes);
}

/** Points for a hole: parPoints at par, strokePoints less for each stroke over (never below 0), more for each under. */
export function holePoints(strokes: number, par: number, cfg: GolfConfig = GOLF_CONFIG): number {
  return Math.max(0, cfg.parPoints - (strokes - par) * cfg.strokePoints);
}

const insideRect = (x: number, y: number, r: Rect) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** The course's edges, as walls just outside it. */
function edges(cfg: GolfConfig): Rect[] {
  const t = 1000;
  return [
    { x: -t, y: -t, w: cfg.width + 2 * t, h: t },
    { x: -t, y: cfg.height, w: cfg.width + 2 * t, h: t },
    { x: -t, y: 0, w: t, h: cfg.height },
    { x: cfg.width, y: 0, w: t, h: cfg.height },
  ];
}

/**
 * Pure game state machine. SHOOT sets the ball rolling; TICK moves it (in small steps): it bounces off walls
 * (firewalls) and the course's edges, slows with friction, goes through tunnels, and a sniffer zone intercepts it
 * (a penalty stroke, and back to where it was hit from). In the hole, it's sunk: the next hole follows after a
 * pause, and after the last hole the game is over.
 */
export function createGolfReducer(cfg: GolfConfig, holes: readonly Hole[] = HOLES) {
  const bounds = edges(cfg);

  function finishHole(state: GolfState, type: 'sunk' | 'gaveUp'): GolfState {
    const hole = holes[state.hole];
    const points = type === 'sunk' ? holePoints(state.strokes, hole.par, cfg) : 0;
    return {
      ...state,
      moving: false,
      ball: { ...state.ball, vx: 0, vy: 0 },
      card: [...state.card, state.strokes],
      score: state.score + points,
      sunkAtMs: state.timeMs,
      events: [...state.events, { type, hole: state.hole, x: state.ball.x, y: state.ball.y, atMs: state.timeMs, strokes: state.strokes, points }],
    };
  }

  /** One small step of rolling, dt in seconds. */
  function step(state: GolfState, dt: number): GolfState {
    const hole = holes[state.hole];
    let { x, y, vx, vy } = state.ball;
    x += vx * dt;
    y += vy * dt;
    const r = cfg.ballRadius;

    // Bounce off walls and edges: push out along the shortest way, and reflect the speed across it.
    for (const wall of [...hole.walls, ...bounds]) {
      const cx = Math.max(wall.x, Math.min(x, wall.x + wall.w));
      const cy = Math.max(wall.y, Math.min(y, wall.y + wall.h));
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.hypot(dx, dy);
      if (d >= r) continue;
      const [nx, ny] = d > 0 ? [dx / d, dy / d] : Math.abs(vx) > Math.abs(vy) ? [-Math.sign(vx), 0] : [0, -Math.sign(vy)];
      x = cx + nx * r;
      y = cy + ny * r;
      const dot = vx * nx + vy * ny;
      if (dot < 0) {
        vx = (vx - 2 * dot * nx) * cfg.bounce;
        vy = (vy - 2 * dot * ny) * cfg.bounce;
      }
    }

    const decay = Math.exp(-cfg.friction * dt);
    vx *= decay;
    vy *= decay;
    let next: GolfState = { ...state, ball: { x, y, vx, vy } };

    // A sniffer zone intercepts the ball: a penalty stroke, and back to where it was hit from.
    if (hole.sniffers.some((s) => insideRect(x, y, s))) {
      return {
        ...next,
        moving: false,
        ball: { ...state.shotFrom, vx: 0, vy: 0 },
        strokes: state.strokes + 1,
        inTunnel: false,
        events: [...state.events, { type: 'intercepted', hole: state.hole, x, y, atMs: state.timeMs }],
      };
    }

    // A tunnel's mouth carries the ball to its exit, still rolling the same way, but gently: a hard putt would bounce
    // off the edge and back into the sniffer it just avoided.
    const tunnel = hole.tunnels.find((t) => Math.hypot(t.from.x - x, t.from.y - y) < cfg.tunnelRadius);
    if (tunnel && !state.inTunnel) {
      const speed = Math.hypot(vx, vy) || 1;
      const out = cfg.tunnelRadius + r + 2;
      const slow = Math.min(speed, cfg.tunnelExitSpeed) / speed;
      next = {
        ...next,
        ball: { x: tunnel.to.x + (vx / speed) * out, y: tunnel.to.y + (vy / speed) * out, vx: vx * slow, vy: vy * slow },
        inTunnel: true,
        events: [...state.events, { type: 'tunnel', hole: state.hole, x: tunnel.to.x, y: tunnel.to.y, atMs: state.timeMs }],
      };
    } else if (!tunnel && state.inTunnel) {
      next = { ...next, inTunnel: false };
    }

    // In the hole (generously: any speed).
    if (Math.hypot(hole.hole.x - next.ball.x, hole.hole.y - next.ball.y) < cfg.holeRadius) return finishHole(next, 'sunk');

    if (Math.hypot(vx, vy) < cfg.stopSpeed) {
      next = { ...next, moving: false, ball: { ...next.ball, vx: 0, vy: 0 } };
      if (next.strokes >= cfg.maxStrokes) return finishHole(next, 'gaveUp');
    }
    return next;
  }

  return function golfReducer(state: GolfState, action: GolfAction): GolfState {
    if (state.over) return state;
    switch (action.type) {
      case 'SHOOT': {
        if (state.moving || state.sunkAtMs !== null) return state;
        const power = Math.min(1, Math.max(0, action.power));
        if (power <= 0) return state;
        const speed = power * cfg.maxShotSpeed;
        return {
          ...state,
          moving: true,
          shotFrom: { x: state.ball.x, y: state.ball.y },
          strokes: state.strokes + 1,
          ball: { ...state.ball, vx: Math.cos(action.angle) * speed, vy: Math.sin(action.angle) * speed },
        };
      }
      case 'TICK': {
        const ms = Math.min(Math.max(0, action.ms), cfg.maxTickMs);
        let s: GolfState = { ...state, timeMs: state.timeMs + ms };
        // After a pause, the next hole, or the end.
        if (s.sunkAtMs !== null) {
          if (s.timeMs - s.sunkAtMs < cfg.sinkPauseMs) return s;
          return s.hole + 1 < holes.length ? startHole(s, s.hole + 1, holes) : { ...s, over: true };
        }
        // Roll in steps of at most 5ms, so a fast ball can't jump through a wall.
        const steps = Math.max(1, Math.ceil(ms / 5));
        for (let i = 0; i < steps && s.moving && s.sunkAtMs === null; i++) s = step(s, ms / steps / 1000);
        return s;
      }
    }
  };
}
