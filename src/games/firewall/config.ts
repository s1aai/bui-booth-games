/**
 * Every tunable value for Firewall Frenzy lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface FirewallConfig {
  title: string;
  /** Mistakes allowed (malware landing, or a safe file blocked) before the game ends. */
  maxStrikes: number;
  /** Columns the files fall down. */
  lanes: number;
  scoring: {
    /** Points for blocking a dangerous file. */
    blocked: number;
    /** Points for letting a safe file through. */
    delivered: number;
    /** Bonus per good call in a row: 0.1 = +10% each. */
    streakStep: number;
    /** Highest the streak multiplier can go (2 = double points). */
    streakCap: number;
  };
  /**
   * The soft cap: files fall faster and come more often with every new file, so the pace eventually beats
   * everyone. Each value is the previous one times `decay`, down to the minimum.
   */
  fall: {
    /** Time for the first files to fall from the top to your network, in ms. */
    startMs: number;
    minMs: number;
    decay: number;
  };
  spawn: {
    /** Wait before the first file, in ms. */
    firstDelayMs: number;
    startIntervalMs: number;
    minIntervalMs: number;
    decay: number;
    /** Chance that a new file is dangerous. */
    dangerousShare: number;
    /** Trickier files join in as the game goes on: the level goes up by one every this many files (up to 3). */
    filesPerLevel: number;
    /** A new file never starts in a column whose last file hasn't fallen this far yet (0-1), so files don't overlap. */
    laneGap: number;
  };
  /** How long "Blocked!", "Strike!" and the like show, in ms. */
  effectMs: number;
  /** Longest single step of game time, in ms: after a stall (e.g. the window was hidden), the game doesn't leap ahead. */
  maxTickMs: number;
  /** Pause on the final screen after the last strike, before the lessons, in ms. */
  endDelayMs: number;
}

export const FIREWALL_CONFIG: FirewallConfig = {
  title: 'Firewall Frenzy',
  maxStrikes: 3,
  lanes: 4,
  scoring: {
    blocked: 100,
    delivered: 50,
    streakStep: 0.1,
    streakCap: 2,
  },
  fall: {
    startMs: 6_000,
    minMs: 2_800,
    decay: 0.98,
  },
  spawn: {
    firstDelayMs: 600,
    startIntervalMs: 1_300,
    minIntervalMs: 600,
    decay: 0.98,
    dangerousShare: 0.5,
    filesPerLevel: 10,
    laneGap: 0.25,
  },
  effectMs: 900,
  maxTickMs: 100,
  endDelayMs: 1_500,
};
