import { describe, expect, it } from 'vitest';
import { PHISH_CONFIG, type PhishConfig, type TierConfig, type TierId } from './config';
import type { Email } from './schema';
import {
  createGameReducer,
  currentCardTimeMs,
  currentEmail,
  inOvertime,
  initialGameState,
  isTimed,
  lastAnswer,
  type GameAction,
  type GameState,
  type Verdict,
} from './state';

function email(id: number, isPhish: boolean): Email {
  return {
    id,
    isPhish,
    difficulty: 1,
    category: isPhish ? 'credential-harvest' : 'legit-notification',
    from: { name: 'Test Sender', address: 'test@example.com' },
    subject: `Email ${id}`,
    body: 'Body',
    links: [],
    tells: [{ type: isPhish ? 'urgency' : 'trusted-domain', text: 'Tell', target: 'body' }],
  };
}

// phish, legit, phish, legit, phish
const DECK = [email(1, true), email(2, false), email(3, true), email(4, false), email(5, true)];

const tier: TierConfig = {
  label: 'Test',
  hint: '',
  startTimeMs: 10_000,
  minTimeMs: 4_000,
  decay: 0.5,
  scoreMultiplier: 1,
  poolWeights: { 1: 1, 2: 1, 3: 1 },
};

const cfg: PhishConfig = {
  ...PHISH_CONFIG,
  maxStrikes: 3,
  scoring: { basePoints: 100, streakStep: 0.1, streakCap: 2 },
  tiers: {
    beginner: tier,
    intermediate: { ...tier, scoreMultiplier: 1.5 },
    experienced: { ...tier, scoreMultiplier: 2 },
  },
  runCap: { maxEmails: 25, maxTimeMs: 20_000 },
  wordTimeBonus: 0,
};
const reduce = createGameReducer(cfg);

/** Answers after 1 second on the card. */
const A = (guess: Verdict, elapsedMs = 1_000): GameAction => ({ type: 'ANSWER', guess, elapsedMs });
const NEXT: GameAction = { type: 'NEXT' };
const TIMEOUT: GameAction = { type: 'TIMEOUT' };
const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(reduce, state);
const start = (deck = DECK, tierId: TierId = 'beginner') =>
  reduce(initialGameState, { type: 'START', tier: tierId, deck });

describe('starting a game', () => {
  it('deals the first card with a clean slate', () => {
    const s = start();
    expect(s.screen).toBe('playing');
    expect(currentEmail(s)?.id).toBe(1);
    expect(s.score).toBe(0);
    expect(s.strikes).toBe(0);
    expect(s.history).toEqual([]);
  });

  it('fully resets a finished game', () => {
    const finished = run(start(), A('safe'), NEXT, A('phish'), NEXT, A('safe'), NEXT);
    expect(finished.screen).toBe('results');
    const s = reduce(finished, { type: 'START', tier: 'beginner', deck: DECK });
    expect(s).toMatchObject({ screen: 'playing', index: 0, score: 0, strikes: 0, streak: 0, elapsedMs: 0, endReason: null });
  });

  it('remembers the chosen tier', () => {
    expect(start(DECK, 'experienced').tier).toBe('experienced');
  });
});

describe('answering', () => {
  it('scores a correct answer and builds the streak', () => {
    const s = run(start(), A('phish'));
    expect(s.screen).toBe('feedback');
    expect(s.score).toBe(100);
    expect(s.streak).toBe(1);
    expect(s.strikes).toBe(0);
    expect(lastAnswer(s)).toMatchObject({ emailId: 1, correct: true, points: 100 });
  });

  it('applies the streak multiplier to consecutive correct answers', () => {
    const s = run(start(), A('phish'), NEXT, A('safe'), NEXT, A('phish'));
    expect(s.score).toBe(100 + 110 + 120);
    expect(lastAnswer(s)?.multiplier).toBeCloseTo(1.2);
  });

  it('ignores extra answers while feedback is showing', () => {
    const s = run(start(), A('phish'), A('phish'), A('safe'));
    expect(s.score).toBe(100);
    expect(s.history).toHaveLength(1);
  });

  it('ignores NEXT unless feedback is showing', () => {
    const s = start();
    expect(reduce(s, NEXT)).toBe(s);
  });

  it('advances to the next card after feedback', () => {
    const s = run(start(), A('phish'), NEXT);
    expect(s.screen).toBe('playing');
    expect(currentEmail(s)?.id).toBe(2);
  });
});

describe('strikes', () => {
  it('gives a strike for calling a phish "Safe"', () => {
    const s = run(start(), A('safe'));
    expect(s.strikes).toBe(1);
    expect(lastAnswer(s)).toMatchObject({ correct: false, points: 0 });
  });

  it('gives a strike for calling a legit email "Phish"', () => {
    const s = run(start(), A('phish'), NEXT, A('phish'));
    expect(s.strikes).toBe(1);
    expect(s.score).toBe(100);
  });

  it('resets the streak on a wrong answer but keeps the best streak', () => {
    const s = run(start(), A('phish'), NEXT, A('safe'), NEXT, A('safe'));
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
    expect(s.score).toBe(210);
  });

  it('ends the game after max strikes, once the feedback has shown', () => {
    let s = run(start(), A('safe'), NEXT, A('phish'), NEXT, A('safe'));
    expect(s.strikes).toBe(3);
    expect(s.screen).toBe('feedback');
    s = reduce(s, NEXT);
    expect(s.screen).toBe('results');
    expect(s.endReason).toBe('strikes');
  });

  it('uses the configured strike limit', () => {
    const oneStrike = createGameReducer({ ...cfg, maxStrikes: 1 });
    const first = oneStrike(initialGameState, { type: 'START', tier: 'beginner', deck: DECK });
    const s = [A('safe'), NEXT].reduce(oneStrike, first);
    expect(s.screen).toBe('results');
    expect(s.endReason).toBe('strikes');
  });

  it('reports "Game over" rather than "Run complete" when the last strike lands on the last card', () => {
    const allPhish = [email(1, true), email(2, true), email(3, true)];
    const s = run(start(allPhish), A('safe'), NEXT, A('safe'), NEXT, A('safe'), NEXT);
    expect(s.screen).toBe('results');
    expect(s.endReason).toBe('strikes');
  });
});

describe('tiers', () => {
  it('applies the tier score multiplier', () => {
    expect(run(start(DECK, 'intermediate'), A('phish')).score).toBe(150);
    expect(run(start(DECK, 'experienced'), A('phish'), NEXT, A('safe')).score).toBe(200 + 220);
  });
});

describe('timer', () => {
  it('shrinks the time per card with each correct answer, down to the minimum', () => {
    let s = start();
    expect(currentCardTimeMs(s, cfg)).toBe(10_000);
    s = run(s, A('phish'), NEXT);
    expect(currentCardTimeMs(s, cfg)).toBe(5_000);
    s = run(s, A('safe'), NEXT);
    expect(currentCardTimeMs(s, cfg)).toBe(4_000);
  });

  it('does not shrink the time after a wrong answer', () => {
    const s = run(start(), A('safe'), NEXT);
    expect(currentCardTimeMs(s, cfg)).toBe(10_000);
  });

  it('gives a strike when the time runs out', () => {
    const s = run(start(), TIMEOUT);
    expect(s.screen).toBe('feedback');
    expect(s.strikes).toBe(1);
    expect(s.streak).toBe(0);
    expect(lastAnswer(s)).toMatchObject({ emailId: 1, guess: null, correct: false, points: 0 });
  });

  it('ignores a timeout that arrives after the answer', () => {
    const s = run(start(), A('phish'), TIMEOUT);
    expect(s.strikes).toBe(0);
    expect(s.history).toHaveLength(1);
  });

  it('counts time spent on cards, capped at the time allowed', () => {
    expect(run(start(), A('phish', 2_500)).elapsedMs).toBe(2_500);
    expect(run(start(), A('phish', 99_000)).elapsedMs).toBe(10_000);
    expect(run(start(), TIMEOUT).elapsedMs).toBe(10_000);
  });
});

describe('end of run', () => {
  it('completes the run once the run time is used up, after the current card', () => {
    // Cards allow 10s, 5s, 4s, 4s here (decay 0.5, min 4s).
    let s = run(start(), A('phish', 9_000), NEXT, A('safe', 5_000), NEXT, A('phish', 4_000));
    expect(s.elapsedMs).toBe(18_000);
    s = run(s, NEXT);
    expect(s.screen).toBe('playing');
    s = run(s, A('safe', 3_000));
    expect(s.screen).toBe('feedback');
    s = run(s, NEXT);
    expect(s.screen).toBe('results');
    expect(s.endReason).toBe('time-up');
  });

  it('reports "Game over" when the last strike and the run time run out together', () => {
    const allPhish = [email(1, true), email(2, true), email(3, true), email(4, true)];
    const s = run(start(allPhish), TIMEOUT, NEXT, A('safe'), NEXT, A('safe', 9_000), NEXT);
    expect(s.endReason).toBe('strikes');
  });

  it('completes the run when the deck runs out', () => {
    let s = start();
    for (const guess of ['phish', 'safe', 'phish', 'safe', 'phish'] as const) s = run(s, A(guess), NEXT);
    expect(s.screen).toBe('results');
    expect(s.endReason).toBe('deck-exhausted');
    expect(s.score).toBe(100 + 110 + 120 + 130 + 140);
  });

  it('has no time limit when runCap.maxTimeMs is 0', () => {
    const untimed = createGameReducer({ ...cfg, runCap: { maxEmails: 25, maxTimeMs: 0 } });
    // Before the 0 check, any time spent at all counted as "time's up".
    const first = untimed(initialGameState, { type: 'START', tier: 'beginner', deck: DECK });
    const s = [A('phish', 5_000), NEXT].reduce(untimed, first);
    expect(s.screen).toBe('playing');
  });
});

describe('overtime', () => {
  // Overtime from the 3rd card: 8s, then 4s, then the 3s floor. The deck (5 emails) is the safety stop.
  const otCfg: PhishConfig = {
    ...cfg,
    timerEnabled: false,
    runCap: { maxEmails: 2, maxTimeMs: 0 },
    overtime: { enabled: true, startTimeMs: 8_000, minTimeMs: 3_000, decay: 0.5, maxEmails: 5 },
  };
  const otReduce = createGameReducer(otCfg);
  const otRun = (s: GameState, ...actions: GameAction[]) => actions.reduce(otReduce, s);
  const otStart = otReduce(initialGameState, { type: 'START', tier: 'beginner', deck: DECK });

  it('carries the run on past runCap.maxEmails, timed, with less time every card', () => {
    let s = otRun(otStart, A('phish'), NEXT);
    expect(inOvertime(s, otCfg)).toBe(false);
    expect(isTimed(s, otCfg)).toBe(false);
    s = otRun(s, A('safe'), NEXT);
    expect(s.screen).toBe('playing');
    expect(inOvertime(s, otCfg)).toBe(true);
    expect(isTimed(s, otCfg)).toBe(true);
    expect(currentCardTimeMs(s, otCfg)).toBe(8_000);
    s = otRun(s, A('phish'), NEXT);
    expect(currentCardTimeMs(s, otCfg)).toBe(4_000);
    // Counts overtime cards, not correct answers: a timeout still shortens the next one.
    s = otRun(s, TIMEOUT, NEXT);
    expect(currentCardTimeMs(s, otCfg)).toBe(3_000);
    s = otRun(s, A('phish'), NEXT);
    expect(s.screen).toBe('results');
    expect(s.endReason).toBe('deck-exhausted');
  });

  it("starts on the booth's 6th email", () => {
    expect(inOvertime({ ...initialGameState, index: 4 })).toBe(false);
    expect(inOvertime({ ...initialGameState, index: 5 })).toBe(true);
  });

  it('never starts when switched off', () => {
    const off = { ...otCfg, overtime: { ...otCfg.overtime, enabled: false } };
    const s = otRun(otStart, A('phish'), NEXT, A('safe'), NEXT);
    expect(inOvertime(s, off)).toBe(false);
    expect(isTimed(s, off)).toBe(false);
  });
});

describe('screens', () => {
  it('starts on the level picker (the arcade shell shows the guide before it)', () => {
    expect(initialGameState.screen).toBe('title');
  });
});
