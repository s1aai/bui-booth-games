/**
 * Every tunable value for Phish or Safe? lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 *
 * Ported from the standalone game (../Spot-The-Fish), keeping its values. The booth extras (leaderboards, the prize
 * draw and the admin panel) are shared by every game, so their settings are in src/shell/config.ts. Sound and the demo
 * aren't in the arcade.
 */
import type { Difficulty } from './schema';

export interface ScoringConfig {
  /** Points for a correct answer, before any multipliers. */
  basePoints: number;
  /** Bonus per consecutive correct answer: 0.1 = +10% for each answer in the streak. */
  streakStep: number;
  /** Highest the streak multiplier can go (2 = double points). */
  streakCap: number;
}

export const TIER_IDS = ['beginner', 'intermediate', 'experienced'] as const;
export type TierId = (typeof TIER_IDS)[number];

export interface TierConfig {
  /** Name on the picker button and the end screen. */
  label: string;
  /** One line under the name on the picker. */
  hint: string;
  /** Time to answer the first email, in ms. */
  startTimeMs: number;
  /** The time to answer never drops below this, in ms. */
  minTimeMs: number;
  /** After each correct answer the time shrinks by this factor: 0.92 = 8% less. */
  decay: number;
  /** Multiplies the points for every correct answer. */
  scoreMultiplier: number;
  /**
   * How often each email difficulty (1-3) is dealt, relative to the others.
   * { 1: 3, 2: 1, 3: 0 } = mostly difficulty 1, some 2, never 3.
   */
  poolWeights: Record<Difficulty, number>;
}

export interface PhishConfig {
  title: string;
  /** Strikes allowed before the game ends. */
  maxStrikes: number;
  scoring: ScoringConfig;
  /** Difficulty tiers the player picks from, in picker order (TIER_IDS). */
  tiers: Record<TierId, TierConfig>;
  /**
   * Per-email countdown. Off for now (the user's call): no timer bar and no timeouts. The tiers' time
   * settings below are kept so it can be switched back on.
   */
  timerEnabled: boolean;
  /** A run ends after this many emails (or goes into overtime, below) or this much answering time. */
  runCap: {
    maxEmails: number;
    /**
     * Counts only time spent on cards, not the feedback flashes. The card in play when it runs out is finished.
     * 0 = no time limit.
     */
    maxTimeMs: number;
  };
  /**
   * The soft cap on scores. After runCap.maxEmails the run carries on into overtime (the "Time trial!") instead of
   * ending: a timer comes on and gets shorter with every card, so sooner or later three strikes end it. The tier's
   * emails are dealt again (reshuffled) once they run out.
   */
  overtime: {
    /** false = the run ends at runCap.maxEmails, as before. */
    enabled: boolean;
    /** Time for the first overtime card, in ms. */
    startTimeMs: number;
    /** Overtime cards never get less than this, in ms (before the long-email bonus). 0 = no floor. */
    minTimeMs: number;
    /** Each overtime card gets this much of the previous one's time: 0.9 = 10% less. */
    decay: number;
    /** Safety stop: a run ends after this many emails in all, even in overtime. */
    maxEmails: number;
  };
  /** Extra time for longer emails: 0.3 = an email at the 60-word limit gets 30% more time. */
  wordTimeBonus: number;
  swipe: {
    /** How far the card must be dragged, in px, to count as an answer. Low = forgiving. */
    thresholdPx: number;
    /** A quick flick at least this fast (px per second) also counts, even if it's shorter. */
    flickVelocity: number;
  };
  feedback: {
    /** How long the "Correct!" flash shows before the next email, in ms. */
    correctMs: number;
    /** How long the "Strike!" (or "Time's up!") flash shows before the next email, in ms. */
    wrongMs: number;
    /** Most tells highlighted per missed email in the end-of-run review (the first ones listed in emails.json). */
    maxTells: number;
  };
  /** The pretend inbox owner shown in each card's "To:" line. emails.json is written for this person. */
  inbox: { name: string; address: string };
}

export const PHISH_CONFIG: PhishConfig = {
  title: 'Phish or Safe?',
  maxStrikes: 3,
  scoring: {
    basePoints: 100,
    streakStep: 0.1,
    streakCap: 2,
  },
  tiers: {
    beginner: {
      label: 'Beginner',
      hint: 'New to security awareness training',
      startTimeMs: 12_000,
      minTimeMs: 5_000,
      decay: 0.92,
      scoreMultiplier: 1,
      poolWeights: { 1: 3, 2: 1, 3: 0 },
    },
    intermediate: {
      label: 'Intermediate',
      hint: "You've done the training and spotted a few scams",
      startTimeMs: 9_000,
      minTimeMs: 3_500,
      decay: 0.92,
      scoreMultiplier: 1.5,
      poolWeights: { 1: 1, 2: 3, 3: 1 },
    },
    experienced: {
      label: 'Experienced',
      hint: 'You work in IT or security',
      startTimeMs: 6_000,
      minTimeMs: 2_000,
      decay: 0.92,
      scoreMultiplier: 2,
      poolWeights: { 1: 0, 2: 1, 3: 3 },
    },
  },
  timerEnabled: false,
  runCap: {
    maxEmails: 5,
    maxTimeMs: 0,
  },
  overtime: {
    enabled: true,
    startTimeMs: 10_000,
    minTimeMs: 0,
    decay: 0.92,
    maxEmails: 250,
  },
  wordTimeBonus: 0.3,
  swipe: {
    thresholdPx: 80,
    flickVelocity: 500,
  },
  feedback: {
    correctMs: 700,
    wrongMs: 1200,
    maxTells: 3,
  },
  inbox: { name: 'Alex', address: 'alex@brightwell.co' },
};
