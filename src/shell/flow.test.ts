import { describe, expect, it } from 'vitest';
import { flowReducer, initialFlowState, type FlowAction, type FlowState } from './flow';
import type { GameResult } from './types';

const result = (lessons: number): GameResult => ({
  score: 300,
  complete: false,
  title: 'Game over',
  stats: [],
  lessons: Array.from({ length: lessons }, () => ({ outcome: 'missed' as const, title: 'A lesson' })),
});

const run = (...actions: FlowAction[]): FlowState => actions.reduce(flowReducer, initialFlowState);

describe('flowReducer', () => {
  it('goes home -> guide -> play -> lessons -> end', () => {
    expect(run({ type: 'START' }).screen).toBe('guide');
    expect(run({ type: 'START' }, { type: 'GUIDE_DONE' }).screen).toBe('play');
    const lessons = run({ type: 'START' }, { type: 'GUIDE_DONE' }, { type: 'FINISH', result: result(2) });
    expect(lessons.screen).toBe('lessons');
    expect(lessons.result?.score).toBe(300);
    expect(flowReducer(lessons, { type: 'LESSONS_DONE' }).screen).toBe('end');
  });

  it('skips the lessons page when there is nothing to show', () => {
    const state = run({ type: 'START' }, { type: 'GUIDE_DONE' }, { type: 'FINISH', result: result(0) });
    expect(state.screen).toBe('end');
  });

  it('Play again starts a fresh run without the guide', () => {
    const end = run({ type: 'START' }, { type: 'GUIDE_DONE' }, { type: 'FINISH', result: result(0) });
    const again = flowReducer(end, { type: 'PLAY_AGAIN' });
    expect(again.screen).toBe('play');
    expect(again.run).toBe(end.run + 1);
    expect(again.result).toBeNull();
  });

  it('tells the game whether the run came from Play again (e.g. to keep its level) or from the guide', () => {
    const first = run({ type: 'START' }, { type: 'GUIDE_DONE' });
    expect(first.replay).toBe(false);
    const again = flowReducer(flowReducer(first, { type: 'FINISH', result: result(0) }), { type: 'PLAY_AGAIN' });
    expect(again.replay).toBe(true);
    const home = flowReducer(again, { type: 'HOME' });
    expect(flowReducer(flowReducer(home, { type: 'START' }), { type: 'GUIDE_DONE' }).replay).toBe(false);
  });

  it('Home and walk-away resets go back to the homepage from anywhere, keeping nothing', () => {
    const lessons = run({ type: 'START' }, { type: 'GUIDE_DONE' }, { type: 'FINISH', result: result(1) });
    const home = flowReducer(lessons, { type: 'HOME' });
    expect(home.screen).toBe('home');
    expect(home.result).toBeNull();
  });

  it('ignores actions from the wrong screen', () => {
    // A game finishing after a walk-away reset already went home.
    expect(flowReducer(initialFlowState, { type: 'FINISH', result: result(1) })).toBe(initialFlowState);
    expect(flowReducer(initialFlowState, { type: 'GUIDE_DONE' })).toBe(initialFlowState);
    expect(flowReducer(initialFlowState, { type: 'PLAY_AGAIN' })).toBe(initialFlowState);
    const guide = run({ type: 'START' });
    expect(flowReducer(guide, { type: 'START' })).toBe(guide);
  });

  it('asks about the prize draw before the guide when the sign-up is on', () => {
    const draw = run({ type: 'START', askDraw: true });
    expect(draw.screen).toBe('draw');
    expect(flowReducer(draw, { type: 'DRAW_DONE' }).screen).toBe('guide');
    expect(run({ type: 'START', askDraw: false }).screen).toBe('guide');
  });

  it('asks for initials when the score makes the leaderboard, then shows where it landed', () => {
    const play = run({ type: 'START' }, { type: 'GUIDE_DONE' });
    const initials = flowReducer(play, { type: 'FINISH', result: result(1), qualifies: true });
    expect(initials.screen).toBe('initials');
    expect(initials.result?.score).toBe(300);
    const lessons = flowReducer(initials, { type: 'INITIALS_DONE', rank: 3 });
    expect(lessons.screen).toBe('lessons');
    expect(lessons.rank).toBe(3);
    const end = flowReducer(flowReducer(play, { type: 'FINISH', result: result(0), qualifies: true }), {
      type: 'INITIALS_DONE',
      rank: 1,
    });
    expect(end.screen).toBe('end');
    expect(end.rank).toBe(1);
  });

  it("forgets the last run's rank on Play again and Home", () => {
    const end = run(
      { type: 'START' },
      { type: 'GUIDE_DONE' },
      { type: 'FINISH', result: result(0), qualifies: true },
      { type: 'INITIALS_DONE', rank: 2 },
    );
    expect(flowReducer(end, { type: 'PLAY_AGAIN' }).rank).toBeNull();
    expect(flowReducer(end, { type: 'HOME' }).rank).toBeNull();
    const again = flowReducer(end, { type: 'PLAY_AGAIN' });
    expect(flowReducer(again, { type: 'FINISH', result: result(0) }).rank).toBeNull();
  });

  it('ignores the new actions from the wrong screen', () => {
    expect(flowReducer(initialFlowState, { type: 'DRAW_DONE' })).toBe(initialFlowState);
    expect(flowReducer(initialFlowState, { type: 'INITIALS_DONE', rank: 1 })).toBe(initialFlowState);
    const end = run({ type: 'START' }, { type: 'GUIDE_DONE' }, { type: 'FINISH', result: result(0) });
    expect(flowReducer(end, { type: 'INITIALS_DONE', rank: 1 })).toBe(end);
  });
});
