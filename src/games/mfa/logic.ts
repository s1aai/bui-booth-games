import type { Rng } from '../../shell/rng';
import { MFA_CONFIG, type MfaConfig } from './config';
import { ACTIVITIES, APPS } from './data';

/**
 * legit: you're signing in, and the prompt matches (approve it). The rest are someone else (deny them):
 * idle: you aren't signing in at all; wrongApp: you're signing in, but the prompt is for another app;
 * wrongCode: the right app, but not your code.
 */
export type PromptKind = 'legit' | 'idle' | 'wrongApp' | 'wrongCode';

export interface Scenario {
  kind: PromptKind;
  /** What the laptop shows: your sign-in (app and code), or what you're doing instead (an index into ACTIVITIES). */
  laptop: { signIn: { app: string; code: number } } | { activity: number };
  /** What the phone's prompt asks about. */
  prompt: { app: string; code: number };
}

export type Answer = 'approve' | 'deny' | 'timeout';

export interface Decision {
  scenario: Scenario;
  answer: Answer;
  /** right, wrong (a strike), or slow: your own sign-in expired before you approved it (no strike, no points). */
  result: 'right' | 'wrong' | 'slow';
  points: number;
  /** Streak multiplier applied to this answer (1 when not right). */
  multiplier: number;
}

export interface MfaState {
  /** prompt (waiting for an answer) -> feedback -> the next prompt, until the third strike. */
  phase: 'prompt' | 'feedback' | 'over';
  scenario: Scenario;
  score: number;
  /** Right calls in a row. */
  streak: number;
  bestStreak: number;
  strikes: number;
  history: Decision[];
}

export type MfaAction =
  | { type: 'ANSWER'; approve: boolean }
  /** The prompt expired: the UI's timer ran out (promptTimeMs). */
  | { type: 'TIMEOUT' }
  /** Move on from the feedback. The caller makes the next scenario (makeScenario), so the reducer never touches randomness. */
  | { type: 'NEXT'; scenario: Scenario };

export function startState(scenario: Scenario): MfaState {
  return { phase: 'prompt', scenario, score: 0, streak: 0, bestStreak: 0, strikes: 0, history: [] };
}

/** Level 1 for the first prompts, then 2, then 3. */
export function levelFor(promptIndex: number, cfg: MfaConfig = MFA_CONFIG): 1 | 2 | 3 {
  return Math.min(3, 1 + Math.floor(promptIndex / cfg.promptsPerLevel)) as 1 | 2 | 3;
}

/** Time to answer the prompt at this position in the run, in ms. */
export function promptTimeMs(promptIndex: number, cfg: MfaConfig = MFA_CONFIG): number {
  return Math.max(cfg.promptTime.minMs, Math.round(cfg.promptTime.startMs * cfg.promptTime.decay ** promptIndex));
}

export function streakMultiplier(streak: number, cfg: MfaConfig = MFA_CONFIG): number {
  return Math.min(cfg.scoring.streakCap, 1 + cfg.scoring.streakStep * streak);
}

const pick = <T,>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length)];

/** A two-digit code, 10-99. */
const randomCode = (rng: Rng) => 10 + Math.floor(rng() * 90);

/**
 * A code that isn't `code`. At level 3 it's a near miss (the digits swapped, or one digit changed), the kind that
 * slips past a quick glance; before that, any other code.
 */
export function otherCode(code: number, level: number, rng: Rng): number {
  if (level < 3) {
    const other = 10 + Math.floor(rng() * 89);
    return other >= code ? other + 1 : other;
  }
  const tens = Math.floor(code / 10);
  const units = code % 10;
  if (rng() < 0.5 && units !== 0 && units !== tens) return units * 10 + tens;
  const newUnits = (units + 1 + Math.floor(rng() * 9)) % 10;
  return tens * 10 + newUnits;
}

/** Picks the kind of prompt for this level, in proportion to its weights. */
function pickKind(level: 1 | 2 | 3, rng: Rng, cfg: MfaConfig): PromptKind {
  const weights = Object.entries(cfg.kindWeights[level]) as [PromptKind, number][];
  let x = rng() * weights.reduce((sum, [, w]) => sum + w, 0);
  for (const [kind, w] of weights) {
    x -= w;
    if (x < 0) return kind;
  }
  return weights[weights.length - 1][0];
}

/** The next laptop-and-prompt pair. Pure: all randomness comes from `rng`. */
export function makeScenario(
  level: 1 | 2 | 3,
  rng: Rng,
  cfg: MfaConfig = MFA_CONFIG,
  apps: readonly string[] = APPS,
  activities: number = ACTIVITIES.length,
): Scenario {
  const kind = pickKind(level, rng, cfg);
  if (kind === 'idle') {
    return { kind, laptop: { activity: Math.floor(rng() * activities) }, prompt: { app: pick(apps, rng), code: randomCode(rng) } };
  }
  const signIn = { app: pick(apps, rng), code: randomCode(rng) };
  if (kind === 'legit') return { kind, laptop: { signIn }, prompt: { ...signIn } };
  if (kind === 'wrongCode') return { kind, laptop: { signIn }, prompt: { app: signIn.app, code: otherCode(signIn.code, level, rng) } };
  const others = apps.filter((app) => app !== signIn.app);
  return { kind, laptop: { signIn }, prompt: { app: pick(others, rng), code: otherCode(signIn.code, 1, rng) } };
}

/**
 * Pure game state machine: a prompt waits for Approve or Deny (or expires), the feedback shows, then the next.
 * Approving only your own sign-in is right; so is denying everyone else's. Three wrong calls end the run.
 */
export function createMfaReducer(cfg: MfaConfig) {
  return function mfaReducer(state: MfaState, action: MfaAction): MfaState {
    switch (action.type) {
      case 'ANSWER':
      case 'TIMEOUT': {
        if (state.phase !== 'prompt') return state;
        const mine = state.scenario.kind === 'legit';
        const answer: Answer = action.type === 'TIMEOUT' ? 'timeout' : action.approve ? 'approve' : 'deny';
        // An expired prompt is a deny: fine for someone else's, but your own sign-in failed.
        const result =
          answer === 'timeout' ? (mine ? 'slow' : 'right') : (answer === 'approve') === mine ? 'right' : 'wrong';
        // Letting someone else's prompt expire is safe, but only a deliberate deny scores.
        const scores = result === 'right' && answer !== 'timeout';
        const multiplier = scores ? streakMultiplier(state.streak, cfg) : 1;
        const points = scores ? Math.round(cfg.scoring.basePoints * multiplier) : 0;
        const streak = result === 'right' ? state.streak + (scores ? 1 : 0) : 0;
        return {
          ...state,
          phase: 'feedback',
          score: state.score + points,
          streak,
          bestStreak: Math.max(state.bestStreak, streak),
          strikes: state.strikes + (result === 'wrong' ? 1 : 0),
          history: [...state.history, { scenario: state.scenario, answer, result, points, multiplier }],
        };
      }
      case 'NEXT':
        if (state.phase !== 'feedback') return state;
        if (state.strikes >= cfg.maxStrikes) return { ...state, phase: 'over' };
        return { ...state, phase: 'prompt', scenario: action.scenario };
    }
  };
}

export const mfaReducer = createMfaReducer(MFA_CONFIG);

/** Why a wrong call was wrong, for the "What you missed" page. */
export function explain(decision: Decision): { title: string; text: string } {
  const { scenario } = decision;
  const { prompt, laptop } = scenario;
  if (scenario.kind === 'legit') {
    return {
      title: 'That was you',
      text: `You were signing in to ${prompt.app} with code ${prompt.code}, and the prompt matched. Denying only locked you out: a match is safe to approve.`,
    };
  }
  if ('activity' in laptop) {
    return {
      title: "You approved a sign-in you didn't start",
      text: `You weren't signing in to anything, so this was someone else. They had your password and only needed your tap. Deny it, report it and change your password.`,
    };
  }
  if (scenario.kind === 'wrongApp') {
    return {
      title: 'Wrong app',
      text: `You were signing in to ${laptop.signIn.app}, but the prompt was for ${prompt.app}: someone else was in your account at the same time.`,
    };
  }
  return {
    title: "The codes didn't match",
    text: `Your screen showed ${laptop.signIn.code}, but the prompt said ${prompt.code}. It was someone else's sign-in, happening at the same moment as yours.`,
  };
}
