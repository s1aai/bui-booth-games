/**
 * Every tunable value for Spot the Risk lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface RiskConfig {
  title: string;
  /** Time to find every risk, in ms. */
  roundMs: number;
  /** Points for each risk found. */
  pointsPerRisk: number;
  /** Finding every risk scores this much for each whole second left. */
  timeBonusPerSecond: number;
  /** A tap on something that isn't a risk costs this much time, in ms, so tapping everywhere doesn't pay. */
  missPenaltyMs: number;
  /** Extra reach around each risk's circle, in scene units (the scene is 1600 wide), for fingers that land close. */
  touchSlop: number;
  /** How long a found risk's tip shows, in ms. */
  tipMs: number;
  /** How long the "−3s" mark shows where a tap missed, in ms. */
  missMarkMs: number;
  /** Longest single step of the clock, in ms: after a stall (e.g. the window was hidden), time doesn't leap ahead. */
  maxTickMs: number;
  /** Pause on the scene when the round ends (the risks still hidden are ringed), before the lessons, in ms. */
  endDelayMs: number;
  /** The countdown turns red below this many ms. */
  hurryMs: number;
}

export const RISK_CONFIG: RiskConfig = {
  title: 'Spot the Risk',
  roundMs: 60_000,
  pointsPerRisk: 100,
  timeBonusPerSecond: 10,
  missPenaltyMs: 3_000,
  touchSlop: 15,
  tipMs: 3_500,
  missMarkMs: 900,
  maxTickMs: 100,
  endDelayMs: 2_500,
  hurryMs: 10_000,
};
