/**
 * Every tunable value for Was That You? lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
import type { PromptKind } from './logic';

export interface MfaConfig {
  title: string;
  /** Wrong calls allowed before the game ends. */
  maxStrikes: number;
  scoring: {
    /** Points for a right call (approving your own sign-in, or denying anyone else's). */
    basePoints: number;
    /** Bonus per right call in a row: 0.1 = +10% each. */
    streakStep: number;
    /** Highest the streak multiplier can go (2 = double points). */
    streakCap: number;
  };
  /**
   * Time to answer each prompt before it expires, in ms. It shrinks with every prompt (the soft cap): each gets
   * `decay` times the previous one's time, down to `minMs`.
   */
  promptTime: {
    startMs: number;
    minMs: number;
    decay: number;
  };
  /** Prompts before the level goes up (up to 3). Later levels have sneakier mismatches. */
  promptsPerLevel: number;
  /** How often each kind of prompt comes up at each level, relative to the others. */
  kindWeights: Record<1 | 2 | 3, Record<PromptKind, number>>;
  /** How long "Correct!" or "Strike!" shows before the next prompt, in ms. */
  feedback: {
    rightMs: number;
    wrongMs: number;
  };
}

export const MFA_CONFIG: MfaConfig = {
  title: 'Was That You?',
  maxStrikes: 3,
  scoring: {
    basePoints: 100,
    streakStep: 0.1,
    streakCap: 2,
  },
  promptTime: {
    startMs: 6_000,
    minMs: 2_000,
    decay: 0.95,
  },
  promptsPerLevel: 8,
  kindWeights: {
    1: { legit: 45, idle: 35, wrongApp: 10, wrongCode: 10 },
    2: { legit: 40, idle: 20, wrongApp: 15, wrongCode: 25 },
    3: { legit: 40, idle: 15, wrongApp: 15, wrongCode: 30 },
  },
  feedback: {
    rightMs: 900,
    wrongMs: 2_200,
  },
};
