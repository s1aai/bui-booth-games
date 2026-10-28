import type { ComponentType, ReactNode } from 'react';
import type { IconName } from './components/Icon';

/** One item on the "What you missed" page after a run. */
export interface Lesson {
  /** Missed (a cross) or got right (a tick). Spot the Risk lists the risks a player found too. */
  outcome: 'missed' | 'found';
  title: string;
  text?: string;
  /** A small picture beside the text: e.g. the two passwords, or the spot in the office. */
  visual?: ReactNode;
  /** More under the text, e.g. Phish or Safe's numbered giveaways, matching the numbers on its email card. */
  detail?: ReactNode;
}

/** What a game hands the shell when a run ends. */
export interface GameResult {
  score: number;
  /** True if the run was finished (all found, all rounds played) rather than lost. Colours the end screen title. */
  complete: boolean;
  /** End screen heading, e.g. "Game over" or "Time's up!". */
  title: string;
  /** An optional line under the heading, e.g. "You found all 8 risks.". */
  reason?: string;
  /** The figures on the end screen, e.g. { label: 'Found', value: '6 / 8' }. */
  stats: { label: string; value: string }[];
  /** The "What you missed" page. Empty skips it. */
  lessons: Lesson[];
  /** Which of the game's `boards` the score goes on (e.g. Phish or Safe's level). Left out for a game with one board. */
  board?: string;
}

export interface PlayProps {
  onFinish: (result: GameResult) => void;
  /** True when Play again started this run (the guide was skipped), e.g. so Phish or Safe keeps the level. */
  replay: boolean;
}

/** Everything the shell needs to know about a game. Each game's index.ts exports one. */
export interface GameModule {
  id: 'risk' | 'password' | 'patch' | 'firewall' | 'mfa' | 'claw' | 'stack' | 'crossing' | 'golf' | 'phish' | 'segment' | 'byteguard' | 'pythonpw';
  /** The game's name. Its last word shows in BUI orange. */
  title: string;
  /** The invitation to play on the homepage. */
  tagline: string;
  /**
   * The user's split: arcade (fast, competitive, score-focused), hybrid (a score, but relaxed), or learn (slow,
   * teaching first). Shown on the menu.
   */
  kind: 'arcade' | 'hybrid' | 'learn';
  /** The security idea it teaches, in a few words, e.g. "Backups & recovery". Shown on the menu and the guide. */
  teaches: string;
  /** Icons floating behind the homepage. */
  homeIcons: IconName[];
  /** The how-to-play guide: three steps. */
  howTo: { icon: IconName; title: string; text: string }[];
  /**
   * Whether the walk-away reset also runs mid-game. Off for a game with a round timer (Spot the Risk): it ends on
   * its own, and a player studying the scene shouldn't be sent home.
   */
  idleResetInPlay: boolean;
  /** A line under the guide's steps, e.g. the keyboard controls. */
  guideNote?: string;
  /** Heading of the page after the run, e.g. "What you missed". */
  lessonsTitle: string;
  /** What to remember, on the end screen. */
  takeaways: string[];
  /** Separate leaderboards, e.g. one per level, so scores on different levels never mix. Left out: one board. */
  boards?: { id: string; label: string }[];
  /** Problems the content validator found at startup. Any at all shows an error screen instead of the game. */
  contentProblems: string[];
  /** The game itself. A fresh one is mounted for each run, and it calls onFinish once when the run ends. */
  Play: ComponentType<PlayProps>;
}
