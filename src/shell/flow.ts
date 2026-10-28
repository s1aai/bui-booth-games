import type { GameResult } from './types';

export type ShellScreen = 'home' | 'draw' | 'guide' | 'play' | 'initials' | 'lessons' | 'end';

export interface FlowState {
  screen: ShellScreen;
  /** The last run's result, for the lessons and end screens. */
  result: GameResult | null;
  /** Counts the games started, so Play again mounts a fresh game. */
  run: number;
  /** The current run came from Play again rather than the guide (passed to the game). */
  replay: boolean;
  /** Where the last run landed on its leaderboard (1 = top), once its initials were saved; otherwise null. */
  rank: number | null;
}

export type FlowAction =
  /** Start on the homepage: the prize draw sign-up if it's on, then the how-to-play guide. */
  | { type: 'START'; askDraw?: boolean }
  /** Entered the prize draw, or "No thanks". */
  | { type: 'DRAW_DONE' }
  /** "Got it" on the guide. */
  | { type: 'GUIDE_DONE' }
  /** The game ended. `qualifies`: the score makes the leaderboard, so ask for initials first. */
  | { type: 'FINISH'; result: GameResult; qualifies?: boolean }
  /** Initials saved: the score landed at `rank`. */
  | { type: 'INITIALS_DONE'; rank: number | null }
  /** Done on the "What you missed" page. */
  | { type: 'LESSONS_DONE' }
  /** Play again on the end screen: straight into a new game, without the guide. */
  | { type: 'PLAY_AGAIN' }
  /** The Home button, or a walk-away reset. Nothing is kept. */
  | { type: 'HOME' };

export const initialFlowState: FlowState = { screen: 'home', result: null, run: 0, replay: false, rank: null };

/** After the run (and its initials): the "What you missed" page if there's anything on it, otherwise the end screen. */
const afterRun = (result: GameResult): ShellScreen => (result.lessons.length > 0 ? 'lessons' : 'end');

/**
 * The shell's screens: home -> prize draw (if asked) -> guide -> play -> initials (for a top score) -> lessons
 * (if there are any) -> end -> play again or home.
 * Each action only works from the screen it belongs to, so a late one (e.g. a game finishing just as the walk-away
 * reset fires) can't jump somewhere unexpected.
 */
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'START':
      return state.screen === 'home' ? { ...state, screen: action.askDraw ? 'draw' : 'guide' } : state;
    case 'DRAW_DONE':
      return state.screen === 'draw' ? { ...state, screen: 'guide' } : state;
    case 'GUIDE_DONE':
      return state.screen === 'guide' ? { ...state, screen: 'play', run: state.run + 1, replay: false } : state;
    case 'FINISH':
      if (state.screen !== 'play') return state;
      return {
        ...state,
        screen: action.qualifies ? 'initials' : afterRun(action.result),
        result: action.result,
        rank: null,
      };
    case 'INITIALS_DONE':
      return state.screen === 'initials' && state.result
        ? { ...state, screen: afterRun(state.result), rank: action.rank }
        : state;
    case 'LESSONS_DONE':
      return state.screen === 'lessons' ? { ...state, screen: 'end' } : state;
    case 'PLAY_AGAIN':
      return state.screen === 'end'
        ? { screen: 'play', result: null, run: state.run + 1, replay: true, rank: null }
        : state;
    case 'HOME':
      return { ...initialFlowState, run: state.run };
  }
}
