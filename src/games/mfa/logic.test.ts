import { describe, expect, it } from 'vitest';
import { mulberry32 } from '../../shell/rng';
import { MFA_CONFIG, type MfaConfig } from './config';
import { ACTIVITIES, APPS } from './data';
import {
  createMfaReducer,
  explain,
  levelFor,
  makeScenario,
  otherCode,
  promptTimeMs,
  startState,
  type MfaState,
  type Scenario,
} from './logic';
import { validateMfaContent } from './validate';

const cfg: MfaConfig = { ...MFA_CONFIG, maxStrikes: 3 };
const reducer = createMfaReducer(cfg);

const legit: Scenario = { kind: 'legit', laptop: { signIn: { app: 'Email', code: 42 } }, prompt: { app: 'Email', code: 42 } };
const idle: Scenario = { kind: 'idle', laptop: { activity: 0 }, prompt: { app: 'Payroll', code: 17 } };
const wrongCode: Scenario = { kind: 'wrongCode', laptop: { signIn: { app: 'Email', code: 42 } }, prompt: { app: 'Email', code: 24 } };
const wrongApp: Scenario = { kind: 'wrongApp', laptop: { signIn: { app: 'Email', code: 42 } }, prompt: { app: 'VPN', code: 58 } };

const answer = (state: MfaState, approve: boolean) => reducer(state, { type: 'ANSWER', approve });
const next = (state: MfaState, scenario: Scenario) => reducer(state, { type: 'NEXT', scenario });

describe('mfaReducer', () => {
  it('approving your own sign-in, or denying anyone else\'s, is right and scores', () => {
    const approved = answer(startState(legit), true);
    expect(approved.history[0]).toMatchObject({ result: 'right', answer: 'approve', points: 100 });
    for (const scenario of [idle, wrongCode, wrongApp]) {
      expect(answer(startState(scenario), false).history[0]).toMatchObject({ result: 'right', answer: 'deny', points: 100 });
    }
  });

  it('approving someone else\'s sign-in, or denying your own, is a strike', () => {
    for (const scenario of [idle, wrongCode, wrongApp]) {
      const state = answer(startState(scenario), true);
      expect(state.strikes).toBe(1);
      expect(state.history[0].result).toBe('wrong');
    }
    expect(answer(startState(legit), false).strikes).toBe(1);
  });

  it('an expired prompt is a deny: safe (no points) for someone else\'s, too slow for your own', () => {
    const expired = reducer(startState(idle), { type: 'TIMEOUT' });
    expect(expired.history[0]).toMatchObject({ result: 'right', answer: 'timeout', points: 0 });
    expect(expired.strikes).toBe(0);
    const slow = reducer(startState(legit), { type: 'TIMEOUT' });
    expect(slow.history[0]).toMatchObject({ result: 'slow', points: 0 });
    expect(slow.strikes).toBe(0);
    expect(slow.streak).toBe(0);
  });

  it('builds a streak bonus on right calls in a row', () => {
    let state = answer(startState(legit), true);
    state = answer(next(state, idle), false);
    expect(state.score).toBe(100 + 110);
    expect(state.streak).toBe(2);
    state = answer(next(state, wrongApp), true);
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(2);
  });

  it('ignores answers during the feedback, and NEXT during a prompt', () => {
    const feedback = answer(startState(legit), true);
    expect(answer(feedback, false)).toBe(feedback);
    expect(reducer(feedback, { type: 'TIMEOUT' })).toBe(feedback);
    const prompt = startState(legit);
    expect(next(prompt, idle)).toBe(prompt);
  });

  it('ends after the third strike, once its feedback has shown', () => {
    let state = answer(startState(idle), true);
    state = answer(next(state, idle), true);
    state = answer(next(state, idle), true);
    expect(state.phase).toBe('feedback');
    expect(next(state, legit).phase).toBe('over');
  });
});

describe('scenarios', () => {
  it('each kind is set up the way its name says', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 500; i++) {
      const s = makeScenario(levelFor(i % 30), rng);
      if (s.kind === 'idle') {
        expect('activity' in s.laptop).toBe(true);
        continue;
      }
      expect('signIn' in s.laptop).toBe(true);
      if (!('signIn' in s.laptop)) continue;
      const { app, code } = s.laptop.signIn;
      expect(code).toBeGreaterThanOrEqual(10);
      expect(code).toBeLessThanOrEqual(99);
      if (s.kind === 'legit') expect(s.prompt).toEqual({ app, code });
      if (s.kind === 'wrongCode') expect(s.prompt.app === app && s.prompt.code !== code).toBe(true);
      if (s.kind === 'wrongApp') expect(s.prompt.app).not.toBe(app);
    }
  });

  it('at level 3 a wrong code is a near miss: digits swapped, or one digit changed', () => {
    const rng = mulberry32(8);
    for (let code = 10; code <= 99; code++) {
      const other = otherCode(code, 3, rng);
      expect(other).not.toBe(code);
      expect(other).toBeGreaterThanOrEqual(10);
      const swapped = (code % 10) * 10 + Math.floor(code / 10);
      expect(other === swapped || Math.floor(other / 10) === Math.floor(code / 10)).toBe(true);
    }
  });

  it('gets harder: levels rise and the time per prompt shrinks to the minimum', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(MFA_CONFIG.promptsPerLevel)).toBe(2);
    expect(levelFor(100)).toBe(3);
    expect(promptTimeMs(0)).toBe(MFA_CONFIG.promptTime.startMs);
    expect(promptTimeMs(10)).toBeLessThan(promptTimeMs(0));
    expect(promptTimeMs(200)).toBe(MFA_CONFIG.promptTime.minMs);
  });

  it('explains every kind of mistake', () => {
    expect(explain({ scenario: legit, answer: 'deny', result: 'wrong', points: 0, multiplier: 1 }).title).toBe('That was you');
    expect(explain({ scenario: idle, answer: 'approve', result: 'wrong', points: 0, multiplier: 1 }).title).toMatch(/didn't start/);
    expect(explain({ scenario: wrongCode, answer: 'approve', result: 'wrong', points: 0, multiplier: 1 }).text).toMatch(/42.*24/);
    expect(explain({ scenario: wrongApp, answer: 'approve', result: 'wrong', points: 0, multiplier: 1 }).text).toMatch(/Email.*VPN/);
  });
});

describe('content', () => {
  it('passes the startup validator', () => {
    expect(validateMfaContent(APPS, ACTIVITIES)).toEqual([]);
  });

  it('the validator catches too few apps and duplicates', () => {
    const problems = validateMfaContent(['Email', 'Email'], []).join('\n');
    expect(problems).toMatch(/at least 3 apps/);
    expect(problems).toMatch(/same name/);
    expect(problems).toMatch(/at least 3 activities/);
  });
});
