import { PHISH_CONFIG, type PhishConfig, type TierId } from './config';
import { wordCount, type Email } from './schema';
import { pointsForCorrect, streakMultiplier } from './scoring';
import { cardTimeMs } from './timer';

export type Verdict = 'phish' | 'safe';
/** The level picker, then the emails, then the end. The arcade shell shows the guide before and the review after. */
export type Screen = 'title' | 'playing' | 'feedback' | 'results';
/**
 * 'deck-exhausted' covers the email cap too, because the deck is dealt at most runCap.maxEmails long
 * (overtime.maxEmails with overtime on).
 */
export type EndReason = 'strikes' | 'deck-exhausted' | 'time-up';

export interface AnswerRecord {
  emailId: number;
  /** null when the timer ran out. */
  guess: Verdict | null;
  correct: boolean;
  points: number;
  /** Streak multiplier applied to this answer (1 when wrong). */
  multiplier: number;
}

export interface GameState {
  screen: Screen;
  tier: TierId;
  /** Shuffled emails for this run. */
  deck: Email[];
  /** Position of the current email in the deck. */
  index: number;
  score: number;
  /** Consecutive correct answers. */
  streak: number;
  bestStreak: number;
  strikes: number;
  history: AnswerRecord[];
  /** Time spent on cards this run, in ms, counted towards runCap.maxTimeMs. */
  elapsedMs: number;
  endReason: EndReason | null;
}

export type GameAction =
  | { type: 'START'; tier: TierId; deck: Email[] }
  /** elapsedMs: how long the card was on screen before the answer. */
  | { type: 'ANSWER'; guess: Verdict; elapsedMs: number }
  | { type: 'TIMEOUT' }
  | { type: 'NEXT' };

export const initialGameState: GameState = {
  screen: 'title',
  tier: 'beginner',
  deck: [],
  index: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  strikes: 0,
  history: [],
  elapsedMs: 0,
  endReason: null,
};

export function currentEmail(state: GameState): Email | undefined {
  return state.deck[state.index];
}

export function lastAnswer(state: GameState): AnswerRecord | undefined {
  return state.history[state.history.length - 1];
}

export function correctCount(state: GameState): number {
  return state.history.filter((a) => a.correct).length;
}

export function isCorrect(email: Email, guess: Verdict | null): boolean {
  return guess !== null && email.isPhish === (guess === 'phish');
}

/** Overtime: past runCap.maxEmails, where the run carries on with a timer that shrinks every card. */
export function inOvertime(state: GameState, config: PhishConfig = PHISH_CONFIG): boolean {
  return config.overtime.enabled && state.index >= config.runCap.maxEmails;
}

/** Whether the current card has a countdown: always with the timer switched on, otherwise only in overtime. */
export function isTimed(state: GameState, config: PhishConfig = PHISH_CONFIG): boolean {
  return config.timerEnabled || inOvertime(state, config);
}

/**
 * Time allowed for the current card, in ms. With the tier timer it shrinks with every correct answer so far;
 * in overtime, with every overtime card so far.
 */
export function currentCardTimeMs(state: GameState, config: PhishConfig = PHISH_CONFIG): number {
  const email = currentEmail(state);
  const words = email ? wordCount(email.body) : 0;
  if (inOvertime(state, config)) {
    return cardTimeMs(config.overtime, state.index - config.runCap.maxEmails, words, config.wordTimeBonus);
  }
  return cardTimeMs(config.tiers[state.tier], correctCount(state), words, config.wordTimeBonus);
}

/**
 * Pure game state machine: title (level picker) -> playing <-> feedback -> results.
 * Timing is measured by the UI and passed in (ANSWER's elapsedMs, TIMEOUT), so the reducer never reads a clock.
 * The deck is shuffled by the caller and passed in with START, so the reducer never touches randomness.
 */
export function createGameReducer(config: PhishConfig) {
  return function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'START': {
        const fresh = { ...initialGameState, tier: action.tier };
        return action.deck.length > 0
          ? { ...fresh, screen: 'playing', deck: action.deck }
          : { ...fresh, screen: 'results', endReason: 'deck-exhausted' };
      }

      case 'ANSWER':
      case 'TIMEOUT': {
        const email = currentEmail(state);
        // Only the first answer per card counts; double taps (or a late timeout) during feedback are ignored.
        if (state.screen !== 'playing' || !email) return state;

        const guess = action.type === 'ANSWER' ? action.guess : null;
        const timeAllowed = currentCardTimeMs(state, config);
        const timeUsed =
          action.type === 'ANSWER' ? Math.min(Math.max(0, action.elapsedMs), timeAllowed) : timeAllowed;
        const correct = isCorrect(email, guess);
        const multiplier = correct ? streakMultiplier(state.streak, config.scoring) : 1;
        const points = correct
          ? pointsForCorrect(state.streak, config.scoring, config.tiers[state.tier].scoreMultiplier)
          : 0;
        const streak = correct ? state.streak + 1 : 0;

        return {
          ...state,
          screen: 'feedback',
          score: state.score + points,
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          strikes: correct ? state.strikes : state.strikes + 1,
          history: [...state.history, { emailId: email.id, guess, correct, points, multiplier }],
          elapsedMs: state.elapsedMs + timeUsed,
        };
      }

      case 'NEXT': {
        if (state.screen !== 'feedback') return state;
        if (state.strikes >= config.maxStrikes) return { ...state, screen: 'results', endReason: 'strikes' };
        if (config.runCap.maxTimeMs > 0 && state.elapsedMs >= config.runCap.maxTimeMs) {
          return { ...state, screen: 'results', endReason: 'time-up' };
        }
        if (state.index + 1 >= state.deck.length) {
          return { ...state, screen: 'results', endReason: 'deck-exhausted' };
        }
        return { ...state, screen: 'playing', index: state.index + 1 };
      }
    }
  };
}

export const gameReducer = createGameReducer(PHISH_CONFIG);
