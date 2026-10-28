import { useEffect, useReducer, type CSSProperties } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import { StrikeIndicator } from '../../shell/components/StrikeIndicator';
import type { GameResult, PlayProps } from '../../shell/types';
import { MFA_CONFIG } from './config';
import { ACTIVITIES } from './data';
import {
  explain,
  levelFor,
  makeScenario,
  mfaReducer,
  promptTimeMs,
  startState,
  type Decision,
  type MfaState,
  type Scenario,
} from './logic';
import './mfa.css';

const cfg = MFA_CONFIG;

/** The laptop: your sign-in and its code, or what you're doing instead. */
function Laptop({ scenario, small = false }: { scenario: Scenario; small?: boolean }) {
  const { laptop } = scenario;
  return (
    <div className={small ? 'mfa-laptop mfa-laptop--small' : 'mfa-laptop'}>
      <div className="mfa-laptop__screen">
        {'signIn' in laptop ? (
          <div className="mfa-signin">
            <p className="mfa-signin__app">
              <Icon name="lock" />
              Signing in to <strong>{laptop.signIn.app}</strong>
            </p>
            <p className="mfa-signin__label">Your code</p>
            <p className="mfa-code">{laptop.signIn.code}</p>
            {!small && <p className="mfa-signin__hint">Approve it on your phone</p>}
          </div>
        ) : (
          <div className="mfa-activity">
            <Icon name={ACTIVITIES[laptop.activity].icon} />
            <p className="mfa-activity__text">{ACTIVITIES[laptop.activity].text}</p>
            <p className="mfa-activity__sub">Not signing in to anything</p>
          </div>
        )}
      </div>
      <div className="mfa-laptop__base" />
    </div>
  );
}

/** The prompt on the phone, as a small card for the lessons page. */
function PromptCard({ scenario }: { scenario: Scenario }) {
  return (
    <div className="mfa-card">
      <p className="mfa-prompt__title">Approve sign-in?</p>
      <p className="mfa-prompt__app">{scenario.prompt.app}</p>
      <p className="mfa-code mfa-code--prompt">{scenario.prompt.code}</p>
    </div>
  );
}

function toResult(state: MfaState): GameResult {
  const count = (fn: (d: Decision) => boolean) => state.history.filter(fn).length;
  return {
    score: state.score,
    complete: false,
    title: 'Game over',
    reason: `${cfg.maxStrikes} wrong calls end the game.`,
    stats: [
      { label: 'Approved (you)', value: String(count((d) => d.result === 'right' && d.answer === 'approve')) },
      { label: 'Denied (not you)', value: String(count((d) => d.result === 'right' && d.answer === 'deny')) },
      { label: 'Best streak', value: String(state.bestStreak) },
    ],
    lessons: state.history
      .filter((d) => d.result === 'wrong')
      .map((d) => ({
        outcome: 'missed',
        ...explain(d),
        visual: (
          <div className="mfa-lesson">
            <Laptop scenario={d.scenario} small />
            <PromptCard scenario={d.scenario} />
          </div>
        ),
      })),
  };
}

/** The phone's message after an answer. */
function feedback(decision: Decision): { title: string; detail: string } {
  const { answer, result, points } = decision;
  if (result === 'slow') return { title: 'Too slow', detail: 'Your own sign-in expired.' };
  if (result === 'wrong') return { title: 'Strike!', detail: answer === 'approve' ? 'An attacker got in.' : 'That was you.' };
  if (answer === 'timeout') return { title: 'Expired', detail: 'Safe, but better still: deny it.' };
  return { title: `Correct! +${points}`, detail: answer === 'approve' ? 'That was you.' : 'Not you: denied.' };
}

/**
 * Was That You?: sign-in prompts pop up on your phone. Approve only the sign-in you started, with the same app and
 * code as your laptop; deny everything else. Three wrong calls end the run, and the prompts get quicker.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(mfaReducer, undefined, () => startState(makeScenario(1, Math.random)));
  const index = state.history.length;
  const last = state.history[state.history.length - 1];
  const timeMs = promptTimeMs(index);

  // Each prompt expires if nobody answers it in time.
  useEffect(() => {
    if (state.phase !== 'prompt') return;
    const id = window.setTimeout(() => dispatch({ type: 'TIMEOUT' }), timeMs);
    return () => window.clearTimeout(id);
  }, [state.phase, index, timeMs]);

  // Show the result on the phone, then the next prompt.
  useEffect(() => {
    if (state.phase !== 'feedback' || !last) return;
    const delay = last.result === 'right' ? cfg.feedback.rightMs : cfg.feedback.wrongMs;
    const id = window.setTimeout(
      () => dispatch({ type: 'NEXT', scenario: makeScenario(levelFor(index), Math.random) }),
      delay,
    );
    return () => window.clearTimeout(id);
  }, [state.phase, last, index]);

  useEffect(() => {
    if (state.phase === 'over') onFinish(toResult(state));
  }, [state, onFinish]);

  // Keyboard: ← denies, → approves. Held keys don't repeat into the next prompt.
  useEffect(() => {
    if (state.phase !== 'prompt') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft') dispatch({ type: 'ANSWER', approve: false });
      else if (e.key === 'ArrowRight') dispatch({ type: 'ANSWER', approve: true });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.phase]);

  const message = state.phase !== 'prompt' && last ? feedback(last) : null;

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <StrikeIndicator strikes={state.strikes} max={cfg.maxStrikes} />
      </Header>
      <main className="mfa">
        <p className="mfa__progress">
          Approve only the sign-in you started
          {state.streak > 1 && <span className="mfa__streak">Streak ×{state.streak}</span>}
        </p>
        <div className="mfa__stage">
          <section className="mfa__laptop" aria-label="Your laptop">
            <Laptop scenario={state.scenario} />
          </section>
          <section className="mfa__phone" aria-label="Your phone">
            <div className="mfa-phone">
              <div className="mfa-phone__screen">
                <div className="mfa-phone__status" aria-hidden="true">
                  <span>9:41</span>
                  <span className="mfa-phone__battery" />
                </div>
                <p className="mfa-phone__app">
                  <Icon name="shield" />
                  Authenticator
                </p>
                {state.phase === 'prompt' ? (
                  <div key={index} className="mfa-prompt">
                    <p className="mfa-prompt__title">Approve sign-in?</p>
                    <p className="mfa-prompt__app">{state.scenario.prompt.app}</p>
                    <p className="mfa-code mfa-code--prompt">{state.scenario.prompt.code}</p>
                    <div className="mfa-timer" aria-hidden="true">
                      <div className="mfa-timer__fill" style={{ '--ms': `${timeMs}ms` } as CSSProperties} />
                    </div>
                    <div className="mfa-prompt__buttons">
                      <button
                        type="button"
                        className="mfa-btn mfa-btn--deny"
                        onClick={() => dispatch({ type: 'ANSWER', approve: false })}
                      >
                        <Icon name="cross" />
                        Deny
                      </button>
                      <button
                        type="button"
                        className="mfa-btn mfa-btn--approve"
                        onClick={() => dispatch({ type: 'ANSWER', approve: true })}
                      >
                        <Icon name="check" />
                        Approve
                      </button>
                    </div>
                  </div>
                ) : (
                  message &&
                  last && (
                    <div className={`mfa-result mfa-result--${last.result}`} role="status">
                      <Icon name={last.result === 'right' ? 'check' : 'cross'} />
                      <p className="mfa-result__title">{message.title}</p>
                      <p className="mfa-result__detail">{message.detail}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
