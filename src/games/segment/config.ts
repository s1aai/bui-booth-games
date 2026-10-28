/**
 * Every tunable value for Segment the Network lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface RoundConfig {
  /** The grid is size x size squares. */
  size: number;
  /** How many device-to-network links to connect. At most the number of link kinds in data.ts. */
  links: number;
  /** Points for solving it. */
  points: number;
}

export interface SegmentConfig {
  title: string;
  /** The whole game's clock, in ms. It waits while a solved puzzle is showing. */
  roundMs: number;
  /**
   * The puzzles in order, getting bigger. After the last, it's repeated (with a new layout) until time runs out.
   */
  rounds: RoundConfig[];
  /** Every link is at least this many squares long, ends included, so none is trivial. */
  minLinkLength: number;
  /** How many random reshapes of the path the generator makes, per square of the grid. More = more tangled. */
  shufflePerCell: number;
  /** Pause on a solved puzzle before the next, in ms. */
  solvedPauseMs: number;
  maxTickMs: number;
  endDelayMs: number;
}

export const SEGMENT_CONFIG: SegmentConfig = {
  title: 'Segment the Network',
  roundMs: 90_000,
  rounds: [
    { size: 5, links: 4, points: 100 },
    { size: 5, links: 4, points: 100 },
    { size: 6, links: 5, points: 150 },
    { size: 6, links: 5, points: 150 },
    { size: 7, links: 6, points: 200 },
  ],
  minLinkLength: 3,
  shufflePerCell: 20,
  solvedPauseMs: 1_200,
  maxTickMs: 100,
  endDelayMs: 1_000,
};
