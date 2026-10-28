/**
 * Every tunable value for Secure Stack lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface StackConfig {
  title: string;
  /** Exposed databases allowed before the system is breached and the game ends. */
  maxStrikes: number;
  /** The play area, in drawing units (Play.tsx draws on this grid). */
  view: {
    width: number;
    height: number;
    /** Height of each block. */
    blockHeight: number;
    /** Width of the foundation, and so of the first block. */
    startWidth: number;
    /** Blocks shown below the sliding one; the view scrolls up as the tower grows. */
    visibleBlocks: number;
  };
  /** A drop this close (drawing units) to the block below snaps into place: "Perfect!", with nothing sliced off. */
  perfectTolerance: number;
  /**
   * How fast the block slides, in drawing units a second. It speeds up with every block placed (the soft cap), so
   * sooner or later everyone misses.
   */
  slide: {
    startSpeed: number;
    speedStep: number;
    maxSpeed: number;
  };
  bonus: {
    /** A Firewall or Login placed on a Database or Web server. */
    protected: number;
    /** A Firewall and a Login stacked together. */
    defenceInDepth: number;
    /** A perfect drop. */
    perfect: number;
  };
  /** How long "+50 Protected" and the like show, and how long a sliced-off piece takes to fall, in ms. */
  effectMs: number;
  /** Longest single step of game time, in ms: after a stall (e.g. the window was hidden), the game doesn't leap ahead. */
  maxTickMs: number;
  /** Pause on the final tower, before the lessons, in ms. */
  endDelayMs: number;
}

export const STACK_CONFIG: StackConfig = {
  title: 'Secure Stack',
  maxStrikes: 3,
  view: {
    width: 1000,
    height: 640,
    blockHeight: 64,
    startWidth: 440,
    visibleBlocks: 6,
  },
  perfectTolerance: 8,
  slide: {
    startSpeed: 380,
    speedStep: 14,
    maxSpeed: 950,
  },
  bonus: {
    protected: 50,
    defenceInDepth: 50,
    perfect: 25,
  },
  effectMs: 1_200,
  maxTickMs: 100,
  endDelayMs: 1_800,
};
