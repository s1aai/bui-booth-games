import { useEffect, useReducer, useRef } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import type { GameResult, Lesson, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { PASSWORD_CONFIG } from './config';
import { PASSWORDS, type PasswordEntry } from './data';
import {
  crackText,
  gapFor,
  lastRound,
  passwordReducer,
  pickPair,
  startState,
  strongerSide,
  type Pair,
  type PasswordState,
  type Side,
} from './logic';
import './password.css';

const cfg = PASSWORD_CONFIG;

/** Both passwords of a missed round, as on the play screen but small: the player's pick and the stronger one. */
function PairChips({ pair, picked }: { pair: Pair; picked: Side }) {
  const stronger = strongerSide(pair);
  return (
    <div className="pw-chips">
      {pair.map((entry, side) => (
        <div key={side} className={side === stronger ? 'pw-chip pw-chip--stronger' : 'pw-chip'}>
          <span className="pw-chip__tag">
            <Icon name={side === stronger ? 'check' : 'cross'} />
            {side === picked ? 'Your pick' : 'Stronger'}
          </span>
          <code className="pw-chip__text">{entry.text}</code>
          <span className="pw-chip__time">{crackText(entry)}</span>
          <span className="pw-chip__why">{entry.why}</span>
        </div>
      ))}
    </div>
  );
}

function toResult(state: PasswordState): GameResult {
  const correct = state.history.filter((round) => round.correct).length;
  const lessons: Lesson[] = state.history
    .filter((round) => !round.correct)
    .map((round) => ({
      outcome: 'missed',
      title: `You picked ${round.pair[round.picked].text}`,
      visual: <PairChips pair={round.pair} picked={round.picked} />,
    }));
  return {
    score: state.score,
    complete: true,
    title: "Time's up!",
    reason: `${correct} right, ${state.history.length - correct} wrong.`,
    stats: [
      { label: 'Correct', value: `${correct} / ${state.history.length}` },
      { label: 'Best streak', value: String(state.bestStreak) },
    ],
    lessons,
  };
}

/** One of the two big password buttons. After the pick it shows its crack time and which one was stronger. */
function PasswordCard({
  entry,
  side,
  state,
  onPick,
}: {
  entry: PasswordEntry;
  side: Side;
  state: PasswordState;
  onPick: (side: Side) => void;
}) {
  const revealed = state.phase !== 'picking';
  const round = revealed ? lastRound(state) : undefined;
  const isStronger = strongerSide(state.pair) === side;
  const classes = ['pw-card'];
  if (revealed) classes.push(isStronger ? 'pw-card--stronger' : 'pw-card--weaker');
  if (round?.picked === side) classes.push('pw-card--picked');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={() => onPick(side)}
      aria-disabled={revealed}
      aria-label={revealed ? `${entry.text}: ${crackText(entry)}` : `Pick ${entry.text}`}
    >
      <span className="pw-card__key" aria-hidden="true">
        {side === 0 ? '←' : '→'}
      </span>
      <code className="pw-card__text">{entry.text}</code>
      <span className="pw-card__time">
        {revealed ? (
          <>
            <Icon name={isStronger ? 'check' : 'cross'} />
            {crackText(entry)}
          </>
        ) : (
          'Tap to pick'
        )}
      </span>
    </button>
  );
}

/**
 * Stronger Password?, a time attack: two passwords, tap the one that takes longer to crack. Each pick reveals both
 * crack times (the clock waits); a right pick adds time, a wrong one takes it away, and the game ends at zero.
 */
export function Play({ onFinish }: PlayProps) {
  // Passwords shown so far this run, so the pairs keep bringing new ones.
  const seen = useRef(new Set<string>());
  const [state, dispatch] = useReducer(passwordReducer, undefined, () => {
    const pair = pickPair(PASSWORDS, gapFor(0), Math.random);
    for (const entry of pair) seen.current.add(entry.text);
    return startState(pair);
  });
  const round = lastRound(state);
  // The clock only drains while you're picking.
  useFrameClock(state.phase === 'picking', (ms) => dispatch({ type: 'TICK', ms }));

  const pick = (side: Side) => dispatch({ type: 'PICK', side });
  const next = () => {
    const pair = pickPair(PASSWORDS, gapFor(state.streak), Math.random, seen.current);
    for (const entry of pair) seen.current.add(entry.text);
    dispatch({ type: 'NEXT', pair });
  };
  const nextRef = useRef(next);
  nextRef.current = next;

  // Hold the reveal, then move on (Next skips the wait).
  useEffect(() => {
    if (state.phase !== 'revealed' || !round) return;
    const id = window.setTimeout(() => nextRef.current(), round.correct ? cfg.reveal.correctMs : cfg.reveal.wrongMs);
    return () => window.clearTimeout(id);
  }, [state.phase, round]);

  useEffect(() => {
    if (state.phase === 'over') onFinish(toResult(state));
  }, [state, onFinish]);

  // Keyboard: ← and → pick; Enter or Space moves on from the reveal. Held keys don't repeat into the next pair.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (state.phase === 'picking' && e.key === 'ArrowLeft') pick(0);
      else if (state.phase === 'picking' && e.key === 'ArrowRight') pick(1);
      else if (state.phase === 'revealed' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.phase]);

  const revealed = state.phase !== 'picking';
  const roundNo = state.history.length + (revealed ? 0 : 1);
  const seconds = Math.ceil(state.timeLeftMs / 1000);
  const hurry = state.timeLeftMs < 5_000;

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <Stat label="Time">
          <span className={hurry ? 'pw__time pw__time--hurry' : 'pw__time'}>{seconds}s</span>
        </Stat>
      </Header>
      <main className="pw">
        <div className="pw__clock" aria-hidden="true">
          <div
            className={hurry ? 'pw__clock-fill pw__clock-fill--hurry' : 'pw__clock-fill'}
            style={{ transform: `scaleX(${state.timeLeftMs / cfg.clock.maxMs})` }}
          />
        </div>
        <p className="pw__progress">
          Round {roundNo}
          {state.streak > 1 && <span className="pw__streak">Streak {state.streak}</span>}
        </p>
        <h1 className="pw__question">Which is harder to crack?</h1>
        <div className="pw__pair">
          {/* New cards each round, so a new pair doesn't fade in from the last one's green and red borders. */}
          <PasswordCard key={`${roundNo}-left`} entry={state.pair[0]} side={0} state={state} onPick={pick} />
          <span className="pw__vs" aria-hidden="true">
            or
          </span>
          <PasswordCard key={`${roundNo}-right`} entry={state.pair[1]} side={1} state={state} onPick={pick} />
        </div>
        <div className="pw__footer">
          {revealed && round ? (
            <>
              <p className={`banner ${round.correct ? 'banner--good' : 'banner--bad'}`} role="status">
                <Icon name={round.correct ? 'check' : 'cross'} />
                {round.correct ? 'Correct!' : 'Wrong!'}
                <span className="banner__detail">
                  {round.correct
                    ? `+${round.points} · +${cfg.clock.rightBonusMs / 1000}s`
                    : `−${cfg.clock.wrongPenaltyMs / 1000}s · the other one lasts longer`}
                </span>
              </p>
              {state.phase === 'revealed' && (
                <button type="button" className="btn btn--primary" onClick={next}>
                  Next
                </button>
              )}
            </>
          ) : (
            <p className="pw__note">{cfg.attackerNote}</p>
          )}
        </div>
      </main>
    </>
  );
}
