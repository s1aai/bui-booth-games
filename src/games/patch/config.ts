/**
 * Every tunable value for Patch Panic lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export const SEVERITIES = ['critical', 'high', 'low'] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface SeverityConfig {
  /** Shown on the badge. */
  label: string;
  /** Points for patching it in time. */
  points: number;
  /** How often this severity pops up, relative to the others. */
  weight: number;
  /** Time to patch it before it's exploited, in ms. */
  deadlineMs: number;
  /**
   * What happens when it's exploited: nothing (Low: that's the prioritising lesson), a strike (High), or breach:
   * instant game over (Critical, the user's call).
   */
  onExploit: 'nothing' | 'strike' | 'breach';
}

export interface PatchConfig {
  title: string;
  /** Exploited High vulnerabilities allowed before the game ends. (A single exploited Critical ends it at once.) */
  maxStrikes: number;
  severities: Record<Severity, SeverityConfig>;
  /**
   * The soft cap: vulnerabilities pop up faster and faster, with no floor, so the pace beats everyone within a few
   * minutes. The gap before each new one is `startIntervalMs` halved for every `halfLifeMs` of game time.
   */
  spawn: {
    /** Wait before the first vulnerability, in ms. */
    firstDelayMs: number;
    startIntervalMs: number;
    halfLifeMs: number;
  };
  /**
   * The time to patch (each severity's deadlineMs) halves for every this many ms of game time. Without it a quick
   * tapper could keep up for ever once every server is busy, however fast they pop up.
   */
  deadlineHalfLifeMs: number;
  /** Points lost for tapping a server with nothing to patch, so tapping everywhere doesn't pay. */
  missPenalty: number;
  /** How long "+200", "Exploited" or a missed tap shows on a server, in ms. Nothing new spawns there meanwhile. */
  flashMs: number;
  /** Longest single step of game time, in ms: after a stall (e.g. the window was hidden), the game doesn't leap ahead. */
  maxTickMs: number;
  /** Pause on the final board after the breach, before the lessons, in ms. */
  endDelayMs: number;
}

export const PATCH_CONFIG: PatchConfig = {
  title: 'Patch Panic',
  maxStrikes: 3,
  severities: {
    critical: { label: 'Critical', points: 200, weight: 2, deadlineMs: 4_000, onExploit: 'breach' },
    high: { label: 'High', points: 100, weight: 3, deadlineMs: 4_000, onExploit: 'strike' },
    low: { label: 'Low', points: 50, weight: 5, deadlineMs: 5_000, onExploit: 'nothing' },
  },
  spawn: {
    firstDelayMs: 800,
    startIntervalMs: 1_800,
    halfLifeMs: 40_000,
  },
  deadlineHalfLifeMs: 90_000,
  missPenalty: 10,
  flashMs: 800,
  maxTickMs: 100,
  endDelayMs: 1_500,
};
