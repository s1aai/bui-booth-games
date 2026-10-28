/**
 * Every tunable value for Data Recovery Claw lives here.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface ClawConfig {
  title: string;
  /** Length of a round, in ms. */
  roundMs: number;
  /** Restoring something bad (see data.ts) this many times ends the round early. */
  maxStrikes: number;
  /** Tricky items (infected backups, locked files) join in after this much of the round, in ms. */
  levelUpMs: number;
  /**
   * The inside of the machine, in drawing units (Play.tsx draws it on this grid). The chute is on the left; the
   * items sit in a row of slots on the floor.
   */
  box: {
    width: number;
    height: number;
    /** Where the claw's carriage runs. */
    railY: number;
    /** Where the items' centres rest. */
    itemY: number;
    itemSize: number;
    /** The chute's centre. Items dropped here are restored. */
    chuteX: number;
    slots: number;
    firstSlotX: number;
    slotGap: number;
  };
  /**
   * The crane (the user's call: real physics). A trolley runs along the rail with momentum, and the claw swings
   * beneath it on its cable like a pendulum. Letting go drops the claw down the cable, still swinging, so it lands
   * where the swing puts it: wait for the swing to settle, or time it.
   */
  claw: {
    /** Trolley top speed while you steer, and while carrying to the chute, in drawing units a second. */
    maxSpeed: number;
    carrySpeed: number;
    /** How hard the trolley speeds up and brakes, in units a second squared. Harder = bigger swings. */
    accel: number;
    /** How eagerly the trolley homes in on your finger (higher = snappier, but it stops harder). */
    followGain: number;
    /** Pendulum gravity: higher swings faster. */
    gravity: number;
    /** How quickly the swing dies away, per second: higher = calmer. */
    damping: number;
    /** Cable length at the top, and how fast it pays out and reels in, in units (a second). */
    restCable: number;
    dropSpeed: number;
    liftSpeed: number;
    /** Time to let go of an item over the chute, in ms. */
    releaseMs: number;
    /** A grab this close to an item's centre (drawing units) always holds. */
    firmGrip: number;
    /** A grab this far off still catches the item, but it may slip. Further off, the claw comes up empty. */
    grabRange: number;
    /** Chance of slipping at the very edge of grabRange; it scales down to 0 at firmGrip. */
    maxSlipChance: number;
  };
  /** Wait before a new item drops into an emptied slot, and how long it takes to fall, in ms. */
  refillMs: number;
  fallMs: number;
  /**
   * The machine keeps changing: every this many ms, the item that's been there longest is swapped for a fresh one
   * (never the one under the claw). That's how the tricky items arrive, and it stops the box filling up with only
   * the bad things nobody takes.
   */
  churnMs: number;
  /** New items are always good while fewer than this many good items are in the machine. */
  minGood: number;
  /** How long "+150 Key" and the like show by the chute, in ms. */
  effectMs: number;
  /** Longest single step of game time, in ms: after a stall (e.g. the window was hidden), the game doesn't leap ahead. */
  maxTickMs: number;
  /** Pause when the round ends, before the lessons, in ms. */
  endDelayMs: number;
}

export const CLAW_CONFIG: ClawConfig = {
  title: 'Data Recovery Claw',
  roundMs: 60_000,
  maxStrikes: 3,
  levelUpMs: 20_000,
  box: {
    width: 1000,
    height: 470,
    railY: 40,
    itemY: 380,
    itemSize: 92,
    chuteX: 80,
    slots: 7,
    firstSlotX: 230,
    slotGap: 115,
  },
  claw: {
    maxSpeed: 420,
    carrySpeed: 520,
    accel: 1000,
    followGain: 5,
    gravity: 6000,
    damping: 2.2,
    restCable: 70,
    dropSpeed: 420,
    liftSpeed: 460,
    releaseMs: 300,
    firmGrip: 20,
    grabRange: 50,
    maxSlipChance: 0.6,
  },
  refillMs: 700,
  fallMs: 400,
  churnMs: 3_500,
  minGood: 3,
  effectMs: 1_400,
  maxTickMs: 100,
  endDelayMs: 1_500,
};
