/**
 * Every tunable value for Stronger Password? lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface PasswordConfig {
  title: string;
  /**
   * Time attack (the user's call): the clock drains while you pick. A right pick adds time, a wrong one takes it
   * away, and the game ends when it hits zero. It's paused while both crack times show.
   */
  clock: {
    startMs: number;
    rightBonusMs: number;
    wrongPenaltyMs: number;
    /** The clock never holds more than this, so an expert still finishes in good time. */
    maxMs: number;
  };
  /** Longest single step of the clock, in ms: after a stall (e.g. the window was hidden), time doesn't leap ahead. */
  maxTickMs: number;
  /**
   * The crack-time model: how many guesses a second the attacker makes. Every crack time on screen is
   * guesses (from data.ts) divided by this. attackerNote must say the same thing.
   */
  guessesPerSecond: number;
  /** The model in one sentence, shown on the guide and under the passwords. Keep it in step with guessesPerSecond. */
  attackerNote: string;
  /** Random passphrases' words come from a list this long (EFF's long word list). validate.ts checks them with it. */
  wordListSize: number;
  scoring: {
    /** Points for a correct pick, before the streak bonus. */
    basePoints: number;
    /** Bonus per consecutive correct pick: 0.1 = +10% for each pick in the streak. */
    streakStep: number;
    /** Highest the streak multiplier can go (2 = double points). */
    streakCap: number;
  };
  /**
   * How far apart the two passwords' crack times are, in orders of magnitude (1 = one is 10x longer). The gap
   * shrinks as the streak grows, so a run gets harder; a wrong pick resets the streak and the gap.
   */
  gap: {
    /** Gap with no streak. */
    startOrders: number;
    /** The gap never goes below this. */
    minOrders: number;
    /** Each pick in the streak takes this much off the gap. */
    stepOrders: number;
    /** Pairs are picked with a gap from the target up to this much more, so late pairs really are close. */
    windowOrders: number;
    /** From this gap down, neither password cracks instantly, so a long streak isn't "password1" against anything. */
    noInstantFromOrders: number;
  };
  /** How long both crack times show after a pick before the next pair, in ms (or tap Next). The clock waits. */
  reveal: {
    correctMs: number;
    wrongMs: number;
  };
}

export const PASSWORD_CONFIG: PasswordConfig = {
  title: 'Stronger Password?',
  clock: {
    startMs: 20_000,
    rightBonusMs: 2_000,
    wrongPenaltyMs: 3_000,
    maxMs: 30_000,
  },
  maxTickMs: 100,
  guessesPerSecond: 1e10,
  attackerNote: 'Crack times assume an attacker with a stolen password file, making 10 billion guesses a second.',
  wordListSize: 7776,
  scoring: {
    basePoints: 100,
    streakStep: 0.1,
    streakCap: 2,
  },
  gap: {
    startOrders: 4,
    minOrders: 1,
    stepOrders: 0.5,
    windowOrders: 2,
    noInstantFromOrders: 2,
  },
  reveal: {
    correctMs: 1_100,
    wrongMs: 2_400,
  },
};
