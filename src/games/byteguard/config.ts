/**
 * Every tunable value for Byte Guard lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface ByteGuardConfig {
  title: string;
  /**
   * The world is `height` game units tall on any screen, and as wide as the screen's shape makes it, from minWidth
   * to maxWidth. `width` is the shape the numbers below were tuned on, and the fallback (e.g. for the tests).
   */
  width: number;
  height: number;
  minWidth: number;
  maxWidth: number;
  /**
   * How much a wider world speeds up the items arriving and Guardie: 1 scales with the width, 0 doesn't. A
   * narrower world slows them the same way. Guardie at 1 crosses any screen in the same time, so the game is only
   * as much harder as there are more items.
   */
  spawnPerWidth: number;
  speedPerWidth: number;
  /** Top edge of the server, in game units. Things that fall past it reach the server. */
  groundY: number;
  /** Height of Guardie, the player, in game units. */
  playerY: number;
  /** Hearts at the start of a run, and the most a BACKUP power-up can give. */
  lives: number;
  maxLives: number;
  /** Streak for each combo step, and the most the combo multiplier gets to. */
  streakPerCombo: number;
  maxCombo: number;
  /** Guardie: how fast it moves (game units a second), and how wide it is. */
  playerSpeed: number;
  playerWidth: number;
  /** How many times playerSpeed a pointer drag can pull Guardie. */
  dragSpeedFactor: number;
  /** Zaps in the air at once, and seconds between zaps. */
  maxBolts: number;
  fireCooldown: number;
  /** How fast a zap flies up (game units a second). */
  boltSpeed: number;
  /** A zap hits an item when the two are this close, in game units (across, then up and down). */
  boltReachX: number;
  boltReachY: number;
  /** An item is caught when it's this close to Guardie's line (above, then below), in game units. */
  catchAbove: number;
  catchBelow: number;
  /** Items are caught when they're this far in from Guardie's edges, in game units. */
  catchInset: number;
  /** Seconds the UPDATE power-up slows the game, and how slow (1 is normal speed). */
  slowSeconds: number;
  slowFactor: number;
  /**
   * The game gets twice as fast every this many seconds, with no cap: items come twice as often and fall twice as
   * fast. It's what ends every run within a few minutes.
   */
  rampSeconds: number;
  /** Seconds between new items at the start. Divided by the speed-up (see rampSeconds). */
  spawnBase: number;
  /** Fall speed (game units a second): base (times the speed-up), plus up to random more. */
  fallBase: number;
  fallRandom: number;
  /** Seconds into a run that password thieves, then ransomware, start falling, and phish start looking like mail. */
  thiefFromSeconds: number;
  lockerFromSeconds: number;
  sneakyFromSeconds: number;
  /** Sideways wobble (game units a second) for a good item, a threat, and a password thief. */
  wobbleGood: number;
  wobbleThreat: number;
  wobbleThief: number;
  /** Chance an item is a power-up. Otherwise a good file, unless the roll is past the good chance, then a threat. */
  powerChance: number;
  /** Chance a falling item is a good file. Falls by goodChancePerSecond, never below goodChanceMin. */
  goodChance: number;
  goodChancePerSecond: number;
  goodChanceMin: number;
  /** How long a score or warning text stays on screen, and how long the red hit flash lasts, in seconds. */
  floatSeconds: number;
  flashSeconds: number;
  /** How long the server's lights stay red after a hit, in seconds. */
  serverHitSeconds: number;
  /** Longest single step of the clock, in ms: after a stall (e.g. the window was hidden), time doesn't leap ahead. */
  maxTickMs: number;
  /** Pause on the final screen for this long, before the lessons, in ms. */
  endDelayMs: number;
}

export const BYTE_GUARD_CONFIG: ByteGuardConfig = {
  title: 'Byte Guard',
  width: 480,
  height: 640,
  minWidth: 360,
  maxWidth: 1600,
  spawnPerWidth: 0.5,
  speedPerWidth: 1,
  groundY: 598,
  playerY: 560,
  lives: 3,
  maxLives: 5,
  streakPerCombo: 5,
  maxCombo: 5,
  playerSpeed: 330,
  playerWidth: 64,
  dragSpeedFactor: 1.6,
  maxBolts: 3,
  fireCooldown: 0.2,
  boltSpeed: 560,
  boltReachX: 4,
  boltReachY: 8,
  catchAbove: 14,
  catchBelow: 12,
  catchInset: 6,
  slowSeconds: 6,
  slowFactor: 0.45,
  rampSeconds: 120,
  spawnBase: 0.975,
  fallBase: 75,
  fallRandom: 28,
  thiefFromSeconds: 24,
  lockerFromSeconds: 48,
  sneakyFromSeconds: 72,
  wobbleGood: 10,
  wobbleThreat: 22,
  wobbleThief: 50,
  powerChance: 0.05,
  goodChance: 0.45,
  goodChancePerSecond: 0.00125,
  goodChanceMin: 0.3,
  floatSeconds: 1.3,
  flashSeconds: 0.3,
  serverHitSeconds: 0.5,
  maxTickMs: 50,
  endDelayMs: 1200,
};
