/**
 * Every tunable value for Password Python lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface PythonPwConfig {
  title: string;
  /**
   * The board the counts below were tuned on, in cells, and a cell's size in game units. A run's board is sized to
   * the screen instead (see targetRows); this one is the fallback, e.g. for the tests.
   */
  cols: number;
  rows: number;
  cell: number;
  /**
   * Sizing the board to the screen: about this many rows, each cell between minCellPx and maxCellPx screen pixels,
   * and as many columns as fit, between minCols and maxCols. A very short stage still gets minRows, smaller.
   */
  targetRows: number;
  minCellPx: number;
  maxCellPx: number;
  minCols: number;
  maxCols: number;
  minRows: number;
  /** How much busier a bigger board is: 1 scales the characters, weak words and bots with its area, 0 doesn't. */
  busyPerArea: number;
  /** The HUD band above the board, in screen pixels: one row on a wide screen, stacked rows on a narrower one. */
  hudPx: number;
  hudNarrowPx: number;
  hudWideFromPx: number;
  /** Wider than this, the one-row HUD grows with the screen: laid out as at this width, then scaled up to fit. */
  hudScaleFromPx: number;
  /** Hearts at the start of a run, and the most a BACKUP power-up can give. */
  lives: number;
  maxLives: number;
  /** Seconds of "get ready" before a run starts, and after losing a life. */
  readySeconds: number;
  lifeReadySeconds: number;
  /** Seconds a new life is safe from bots. */
  invulnSeconds: number;
  /** Snake speed (cells a second) at the start, and the seconds of play it takes to double. No top speed. */
  startSpeed: number;
  speedDoubleSeconds: number;
  /**
   * Bots: the most at once, a new one every botEverySeconds until then, and their speed (cells a second) at the
   * start: base, plus perBot for each bot after the first. Bots move, and weak words turn up, twice as fast every
   * botDoubleSeconds, with no cap. It's what ends every run within a few minutes.
   */
  maxBots: number;
  botEverySeconds: number;
  botSpeed: number;
  botSpeedPerBot: number;
  botDoubleSeconds: number;
  /** Seconds into a run the first bot starts chasing, and how often it chases instead of wandering. */
  chaserFromSeconds: number;
  chaseChance: number;
  /** Seconds a bot is stunned after a bite, and after it's zapped and respawns. */
  botBounceSeconds: number;
  botRespawnSeconds: number;
  /** Points: each character eaten is this times the kinds in the password; a zapped bot; a VAULT pickup. */
  eatPoints: number;
  botZapPoints: number;
  vaultPoints: number;
  /** Bonus for reaching a crack-time goal: this times the goal's number (1 for the first). */
  goalBonus: number;
  /** Characters a VAULT adds, and seconds the MFA shield lasts. */
  vaultChars: number;
  shieldSeconds: number;
  /** Seconds a weak word or a power-up stays on the board. */
  weakTtl: number;
  powerTtl: number;
  /**
   * How often a weak word and a power-up turn up: the first wait and the gap after it (the weak-word gap shrinks,
   * see botDoubleSeconds). One more weak word may be on the board every weakMoreSeconds.
   */
  weakFirstSeconds: number;
  weakEverySeconds: number;
  weakMoreSeconds: number;
  powerFirstSeconds: number;
  powerEverySeconds: number;
  /** Seconds a score text stays on screen. */
  floatSeconds: number;
  /** Longest single step of the clock, in ms: after a stall (e.g. the window was hidden), time doesn't leap ahead. */
  maxTickMs: number;
  /** Pause on the final screen for this long, before the lessons, in ms. */
  endDelayMs: number;
}

export const PYTHON_PW_CONFIG: PythonPwConfig = {
  title: 'Password Python',
  cols: 18,
  rows: 22,
  cell: 24,
  targetRows: 18,
  minCellPx: 22,
  maxCellPx: 48,
  minCols: 12,
  maxCols: 48,
  minRows: 12,
  busyPerArea: 1,
  hudPx: 64,
  hudNarrowPx: 128,
  hudWideFromPx: 1000,
  hudScaleFromPx: 1366,
  lives: 3,
  maxLives: 5,
  readySeconds: 1.6,
  lifeReadySeconds: 1.4,
  invulnSeconds: 2,
  startSpeed: 6.5,
  speedDoubleSeconds: 150,
  maxBots: 4,
  botEverySeconds: 30,
  botSpeed: 2.3,
  botSpeedPerBot: 0.15,
  botDoubleSeconds: 75,
  chaserFromSeconds: 60,
  chaseChance: 0.55,
  botBounceSeconds: 0.8,
  botRespawnSeconds: 1.5,
  eatPoints: 10,
  botZapPoints: 50,
  vaultPoints: 60,
  goalBonus: 100,
  vaultChars: 3,
  shieldSeconds: 8,
  weakTtl: 7,
  powerTtl: 9,
  weakFirstSeconds: 4,
  weakEverySeconds: 8,
  weakMoreSeconds: 90,
  powerFirstSeconds: 10,
  powerEverySeconds: 13,
  floatSeconds: 1.6,
  maxTickMs: 50,
  endDelayMs: 1200,
};
