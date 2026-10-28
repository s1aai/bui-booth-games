/**
 * Every tunable value for Network Golf lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface GolfConfig {
  title: string;
  /** The course, in drawing units. */
  width: number;
  height: number;
  ballRadius: number;
  holeRadius: number;
  /** Radius of a tunnel's mouth. */
  tunnelRadius: number;
  /** A tunnel lets the ball out at most this fast (units a second), so it can't bounce back into the sniffer it avoided. */
  tunnelExitSpeed: number;
  /** Speed of a full-power shot, in units a second. */
  maxShotSpeed: number;
  /** Drag this far (units) for full power. */
  maxDrag: number;
  /** How quickly the ball slows: its speed is multiplied by e^(-friction x seconds). */
  friction: number;
  /** Below this speed (units a second) the ball stops. */
  stopSpeed: number;
  /** How bouncy walls are (1 = no speed lost). */
  bounce: number;
  /** After this many strokes on a hole, the game moves on. */
  maxStrokes: number;
  /** Points for a hole in par; each stroke over costs strokePoints, each under earns it. */
  parPoints: number;
  strokePoints: number;
  /** Pause after the ball drops, before the next hole, in ms. */
  sinkPauseMs: number;
  /** How long "Intercepted!" and the like show, in ms. */
  effectMs: number;
  maxTickMs: number;
  endDelayMs: number;
  /** The course, new each game (course.ts). Its layouts are drawn for the 1000 x 600 course. */
  course: {
    /** A firewall's thickness, and the height of its open port. */
    wallWidth: number;
    portGap: number;
    /** Ports, starts and servers stay at least this far from the top and bottom edges. */
    edge: number;
    /** The start is at most this far above or below the port or tunnel it aims at first, so the first shot isn't too steep. */
    maxClimb: number;
    /** A tunnel's mouths sit this far outside its sniffer zone. */
    tunnelOffset: number;
  };
}

export const GOLF_CONFIG: GolfConfig = {
  title: 'Network Golf',
  width: 1000,
  height: 600,
  ballRadius: 14,
  holeRadius: 24,
  tunnelRadius: 36,
  tunnelExitSpeed: 350,
  maxShotSpeed: 1500,
  maxDrag: 280,
  friction: 1.5,
  stopSpeed: 10,
  bounce: 0.8,
  maxStrokes: 8,
  parPoints: 500,
  strokePoints: 100,
  sinkPauseMs: 1_400,
  effectMs: 1_300,
  maxTickMs: 50,
  endDelayMs: 1_500,
  course: { wallWidth: 40, portGap: 110, edge: 110, maxClimb: 200, tunnelOffset: 80 },
};
