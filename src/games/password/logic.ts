import type { Rng } from '../../shell/rng';
import { PASSWORD_CONFIG, type PasswordConfig } from './config';
import type { PasswordEntry } from './data';

export type Pair = readonly [PasswordEntry, PasswordEntry];
export type Side = 0 | 1;

// ---------- The crack-time model ----------

/** Characters a password generator could have picked from, counted by the kinds this text uses. */
export function charsetSize(text: string): number {
  return (
    (/[a-z]/.test(text) ? 26 : 0) +
    (/[A-Z]/.test(text) ? 26 : 0) +
    (/[0-9]/.test(text) ? 10 : 0) +
    (/[^a-zA-Z0-9]/.test(text) ? 32 : 0)
  );
}

/** A random password: on average the attacker tries half of all combinations of its length and characters. */
export function randomLog10Guesses(text: string): number {
  return text.length * Math.log10(charsetSize(text)) - Math.log10(2);
}

/** A passphrase of random words from a list the attacker knows: half of all combinations, on average. */
export function passphraseLog10Guesses(words: number, listSize: number): number {
  return words * Math.log10(listSize) - Math.log10(2);
}

/** Orders of magnitude of seconds to crack: 0 = 1 second, 3 = about 17 minutes. Negative = under a second. */
export function log10Seconds(entry: PasswordEntry, cfg: PasswordConfig = PASSWORD_CONFIG): number {
  return entry.log10Guesses - Math.log10(cfg.guessesPerSecond);
}

/**
 * Strength on the game's scale: orders of magnitude of crack time, where everything under a second counts the
 * same ("instantly"). Two instant passwords are never paired, since their crack times would read the same.
 */
export function strength(entry: PasswordEntry, cfg: PasswordConfig = PASSWORD_CONFIG): number {
  return Math.max(0, log10Seconds(entry, cfg));
}

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;

function count(n: number, unit: string): string {
  return `${n.toLocaleString()} ${unit}${n === 1 ? '' : 's'}`;
}

/** "instantly", "24 seconds", "2 days", "5,100 years", "59 trillion years". Two significant figures at most. */
export function formatDuration(seconds: number): string {
  if (seconds < 1) return 'instantly';
  if (seconds < MINUTE) return count(Math.round(seconds), 'second');
  if (seconds < HOUR) return count(Math.round(seconds / MINUTE), 'minute');
  if (seconds < DAY) return count(Math.round(seconds / HOUR), 'hour');
  if (seconds < MONTH) return count(Math.round(seconds / DAY), 'day');
  if (seconds < YEAR) return count(Math.round(seconds / MONTH), 'month');
  const years = seconds / YEAR;
  const round2 = (n: number) => Number(n.toPrecision(2));
  if (years < 1e6) return count(round2(years), 'year');
  if (years < 1e9) return `${round2(years / 1e6).toLocaleString()} million years`;
  if (years < 1e12) return `${round2(years / 1e9).toLocaleString()} billion years`;
  return `${round2(years / 1e12).toLocaleString()} trillion years`;
}

/** "Cracked instantly" or "Cracked in 2 days". */
export function crackText(entry: PasswordEntry, cfg: PasswordConfig = PASSWORD_CONFIG): string {
  const time = formatDuration(10 ** log10Seconds(entry, cfg));
  return time === 'instantly' ? 'Cracked instantly' : `Cracked in ${time}`;
}

// ---------- Picking pairs ----------

/** Target gap between the two crack times for the current streak, in orders of magnitude. */
export function gapFor(streak: number, cfg: PasswordConfig = PASSWORD_CONFIG): number {
  const { startOrders, minOrders, stepOrders } = cfg.gap;
  return Math.max(minOrders, startOrders - stepOrders * streak);
}

/**
 * Two passwords whose strengths differ by at least `gap`, in random order; once the gap is small
 * (cfg.gap.noInstantFromOrders), neither cracks instantly. Prefers passwords not yet `seen` this run, then pairs within
 * the gap window (so a small target gap gives a close pair, not just any pair). Falls back to the widest pair if
 * nothing fits.
 */
export function pickPair(
  pool: readonly PasswordEntry[],
  gap: number,
  rng: Rng,
  seen: ReadonlySet<string> = new Set(),
  cfg: PasswordConfig = PASSWORD_CONFIG,
): Pair {
  let best: { i: number; j: number }[] = [];
  let bestScore = -1;
  let widest = { i: 0, j: 1, d: -1 };
  const noInstant = gap <= cfg.gap.noInstantFromOrders;
  const instant = (entry: PasswordEntry) => log10Seconds(entry, cfg) < 0;
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      const d = Math.abs(strength(pool[i], cfg) - strength(pool[j], cfg));
      if (d > widest.d) widest = { i, j, d };
      if (d < gap) continue;
      if (noInstant && (instant(pool[i]) || instant(pool[j]))) continue;
      const unseen = Number(!seen.has(pool[i].text)) + Number(!seen.has(pool[j].text));
      const score = 2 * unseen + (d < gap + cfg.gap.windowOrders ? 1 : 0);
      if (score > bestScore) {
        best = [];
        bestScore = score;
      }
      if (score === bestScore) best.push({ i, j });
    }
  }
  const { i, j } = best.length > 0 ? best[Math.floor(rng() * best.length)] : widest;
  return rng() < 0.5 ? [pool[i], pool[j]] : [pool[j], pool[i]];
}

/** Which side takes longer to crack. */
export function strongerSide(pair: Pair): Side {
  return pair[0].log10Guesses > pair[1].log10Guesses ? 0 : 1;
}

// ---------- The game ----------

export interface RoundRecord {
  pair: Pair;
  picked: Side;
  correct: boolean;
  points: number;
  /** Streak multiplier applied to this pick (1 when wrong). */
  multiplier: number;
}

export interface PasswordState {
  /** picking -> revealed (both crack times show; the clock waits) -> picking the next pair, until time runs out. */
  phase: 'picking' | 'revealed' | 'over';
  pair: Pair;
  /** Time attack: what's left on the clock, in ms. */
  timeLeftMs: number;
  score: number;
  /** Consecutive correct picks. */
  streak: number;
  bestStreak: number;
  history: RoundRecord[];
}

export type PasswordAction =
  | { type: 'PICK'; side: Side }
  /** Move on from the reveal. The caller picks the next pair (pickPair with gapFor(state.streak)). */
  | { type: 'NEXT'; pair: Pair }
  /** Time passed while picking, in ms (from requestAnimationFrame). */
  | { type: 'TICK'; ms: number };

export function startState(pair: Pair, cfg: PasswordConfig = PASSWORD_CONFIG): PasswordState {
  return { phase: 'picking', pair, timeLeftMs: cfg.clock.startMs, score: 0, streak: 0, bestStreak: 0, history: [] };
}

/** Multiplier for a correct pick after `streak` correct ones in a row: 1x, 1.1x, 1.2x ... capped. */
export function streakMultiplier(streak: number, cfg: PasswordConfig = PASSWORD_CONFIG): number {
  return Math.min(cfg.scoring.streakCap, 1 + cfg.scoring.streakStep * streak);
}

/** The last pick, while its crack times are showing. */
export function lastRound(state: PasswordState): RoundRecord | undefined {
  return state.history[state.history.length - 1];
}

/**
 * Pure game state machine, a time attack: the clock drains while you pick (TICK), a right pick adds time and a
 * wrong one takes it away, and the game ends when it runs out. The caller passes the next pair in with NEXT, so the
 * reducer never touches randomness.
 */
export function createPasswordReducer(cfg: PasswordConfig) {
  return function passwordReducer(state: PasswordState, action: PasswordAction): PasswordState {
    switch (action.type) {
      case 'TICK': {
        if (state.phase !== 'picking') return state;
        const timeLeftMs = state.timeLeftMs - Math.min(Math.max(0, action.ms), cfg.maxTickMs);
        return timeLeftMs > 0 ? { ...state, timeLeftMs } : { ...state, timeLeftMs: 0, phase: 'over' };
      }
      case 'PICK': {
        if (state.phase !== 'picking') return state;
        const correct = action.side === strongerSide(state.pair);
        const multiplier = correct ? streakMultiplier(state.streak, cfg) : 1;
        const points = correct ? Math.round(cfg.scoring.basePoints * multiplier) : 0;
        const streak = correct ? state.streak + 1 : 0;
        const timeLeftMs = correct
          ? Math.min(cfg.clock.maxMs, state.timeLeftMs + cfg.clock.rightBonusMs)
          : Math.max(0, state.timeLeftMs - cfg.clock.wrongPenaltyMs);
        return {
          ...state,
          phase: 'revealed',
          timeLeftMs,
          score: state.score + points,
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          history: [...state.history, { pair: state.pair, picked: action.side, correct, points, multiplier }],
        };
      }
      case 'NEXT': {
        if (state.phase !== 'revealed') return state;
        // A wrong pick can use up the last of the clock: the reveal still shows, then the game ends.
        if (state.timeLeftMs <= 0) return { ...state, phase: 'over' };
        return { ...state, phase: 'picking', pair: action.pair };
      }
    }
  };
}

export const passwordReducer = createPasswordReducer(PASSWORD_CONFIG);
