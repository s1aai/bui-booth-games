/**
 * Tunable values shared by every game. Each game's own numbers are in src/games/<id>/config.ts.
 * Change a value, save, and rebuild. No other file needs editing.
 */
export interface ShellConfig {
  kiosk: {
    /** With no touch, click, scroll or key press for this long, the guide and end screen go back to the homepage, in ms. */
    idleResetMs: number;
    /** The same on the "What you missed" page, which takes longer to read, in ms. */
    lessonsIdleResetMs: number;
    /** The same mid-game, in ms. Nothing is saved. */
    gameIdleResetMs: number;
    /** If the game ever crashes, it shows an apology and reloads itself after this long, in ms. */
    crashReloadMs: number;
    /** Homepage background: how many icons float around. */
    homeParticles: number;
  };
  /** The arcade build's menu: its name (the last word shows in BUI orange) and the line under it. */
  arcade: {
    title: string;
    tagline: string;
  };
  /** Top scores, kept on this PC (every game in the kiosk browser shares them). */
  leaderboard: {
    /** How many scores each board keeps. A run that would make this list asks for initials. */
    size: number;
    /** How many of them the end screen shows. */
    endScreenRows: number;
  };
  /**
   * The prize draw sign-up, asked before the first game (the arcade's opening screen, or after Start in a single game).
   * Booth staff can switch it off in the admin panel.
   */
  prizeDraw: {
    /** Asked unless the admin panel has switched it off on this PC. */
    askByDefault: boolean;
    title: string;
    /** Why the details are wanted. BUI to confirm the wording for POPIA (who keeps them, why, for how long). */
    purpose: string;
  };
  /** The hidden booth staff panel: hold the top-left corner of the menu (or homepage), then enter the PIN. */
  admin: {
    /** Digits only, 4 to 8 of them. Set by the user (2026-10-27). */
    pin: string;
    /** How long the corner has to be held, in ms. */
    holdMs: number;
    /** Wrong PINs in a row before the keypad locks. */
    maxTries: number;
    /** How long it stays locked, in ms. */
    lockoutMs: number;
  };
  /** Call to action on the end screen. */
  cta: string;
  /** Theme on first load. Once someone uses the header toggle, their choice is remembered on this device. */
  defaultTheme: 'dark' | 'light';
}

export const SHELL_CONFIG: ShellConfig = {
  kiosk: {
    idleResetMs: 15_000,
    lessonsIdleResetMs: 30_000,
    gameIdleResetMs: 30_000,
    crashReloadMs: 8_000,
    homeParticles: 14,
  },
  arcade: {
    title: 'BUI Cyber Arcade',
    tagline: 'Pick a game. Outsmart the attackers.',
  },
  leaderboard: {
    size: 10,
    endScreenRows: 5,
  },
  prizeDraw: {
    askByDefault: true,
    title: 'Enter the prize draw?',
    purpose: "Leave your email or phone number to go into the draw. We'll only use it to contact you if you win.",
  },
  admin: {
    pin: '7537',
    holdMs: 3_000,
    maxTries: 3,
    lockoutMs: 30_000,
  },
  cta: 'See how your team scores. Book a demo.',
  defaultTheme: 'dark',
};
