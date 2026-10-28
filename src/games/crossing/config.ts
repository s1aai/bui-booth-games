/**
 * Every tunable value for Cyber Crossing lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export type LaneType = 'traffic' | 'ddos' | 'router';

export interface LaneConfig {
  type: LaneType;
  /** How fast its threats move up or down, in rows a second (routers don't move). */
  speed: number;
  /** Average distance between threats, in rows. */
  gap: number;
}

export interface CrossingConfig {
  title: string;
  /** Length of a round, in ms. */
  roundMs: number;
  /** Hits allowed before the game ends. */
  maxStrikes: number;
  /** Rows of the field. Row 0, along the top, is the secure route. */
  rows: number;
  /** The row the packet starts on, at your laptop. */
  startRow: number;
  /** The columns between your laptop (left) and the server (right), left to right. */
  lanes: LaneConfig[];
  /** Hacked routers in each router column (moved around after every delivery). */
  hackedPerRouterLane: number;
  /** Shortest time between two hops, in ms, and between hops along the secure route (inspection adds delay). */
  hopMs: number;
  secureHopMs: number;
  /** After a hit, the new packet waits this long at your laptop, in ms. */
  respawnMs: number;
  /** How close (in rows) a threat must be to hit the packet. */
  hitRadius: { traffic: number; ddos: number };
  scoring: {
    /** Points for each packet delivered. */
    delivered: number;
    /** Extra for a delivery quicker than expressMs (only the direct route is that quick). */
    express: number;
    expressMs: number;
  };
  /** The soft cap: after each delivery threats move this much faster, up to maxSpeedUp times their start speed. */
  speedUp: number;
  maxSpeedUp: number;
  /** How long "+150 Express!" and the like show, in ms. */
  effectMs: number;
  /** Longest single step of game time, in ms: after a stall (e.g. the window was hidden), the game doesn't leap ahead. */
  maxTickMs: number;
  /** Pause when the game ends, before the lessons, in ms. */
  endDelayMs: number;
}

export const CROSSING_CONFIG: CrossingConfig = {
  title: 'Cyber Crossing',
  roundMs: 60_000,
  maxStrikes: 3,
  rows: 7,
  startRow: 4,
  lanes: [
    { type: 'traffic', speed: 1.5, gap: 3 },
    { type: 'router', speed: 0, gap: 0 },
    { type: 'traffic', speed: 2.1, gap: 2.6 },
    { type: 'ddos', speed: 3.4, gap: 1.35 },
    { type: 'traffic', speed: 1.8, gap: 2.8 },
    { type: 'router', speed: 0, gap: 0 },
    { type: 'traffic', speed: 2.4, gap: 2.4 },
  ],
  hackedPerRouterLane: 2,
  hopMs: 140,
  secureHopMs: 650,
  respawnMs: 400,
  hitRadius: { traffic: 0.6, ddos: 0.5 },
  scoring: {
    delivered: 100,
    express: 50,
    expressMs: 4_000,
  },
  speedUp: 1.07,
  maxSpeedUp: 2,
  effectMs: 1_200,
  maxTickMs: 100,
  endDelayMs: 1_500,
};
