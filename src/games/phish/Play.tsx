import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useEffect, useReducer, useRef } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { StrikeIndicator } from '../../shell/components/StrikeIndicator';
import type { GameResult, Lesson, PlayProps } from '../../shell/types';
import { AnswerButtons } from './AnswerButtons';
import { PHISH_CONFIG, TIER_IDS, type TierId } from './config';
import { EMAILS } from './data';
import { EmailCard } from './EmailCard';
import { FeedbackBanner, feedbackText } from './FeedbackBanner';
import { lessonTells, mistakes } from './lesson';
import { buildDeck, extendDeck } from './pool';
import type { Email, Tell } from './schema';
import {
  correctCount,
  currentCardTimeMs,
  currentEmail,
  gameReducer,
  inOvertime,
  initialGameState,
  isTimed,
  lastAnswer,
  type GameState,
  type Verdict,
} from './state';
import { cardExit, SwipeCard } from './SwipeCard';
import { TimerBar } from './TimerBar';
import './phish.css';

const cfg = PHISH_CONFIG;

/** The level last played. The shell mounts a fresh Play for every run, and Play again keeps the level. */
let lastTier: TierId | null = null;

/** The emails for a run at this level: a shuffled deck, carried on for overtime. */
function deckFor(tier: TierId): Email[] {
  const { poolWeights } = cfg.tiers[tier];
  const deck = buildDeck(EMAILS, poolWeights, cfg.runCap.maxEmails);
  const { enabled, maxEmails } = cfg.overtime;
  return enabled ? extendDeck(deck, EMAILS, poolWeights, maxEmails) : deck;
}

/** Under a missed email: what gave it away (or why it was fine), numbered to match the highlights on the card. */
function Giveaways({ email, tells }: { email: Email; tells: readonly Tell[] }) {
  return (
    <ol className={`ps-tells ps-tells--${email.isPhish ? 'flag' : 'safe'}`}>
      {tells.map((tell, i) => (
        <li key={i} className="ps-tells__item">
          <span className="ps-tells__n">{i + 1}</span>
          {tell.text}
        </li>
      ))}
    </ol>
  );
}

export function toResult(state: GameState): GameResult {
  const gameOver = state.endReason === 'strikes';
  const lessons: Lesson[] = mistakes(state.history, state.deck).map(({ answer, email }) => {
    const tells = lessonTells(email);
    const said = answer.guess === null ? "Time's up!" : `You said ${answer.guess === 'phish' ? 'Phish' : 'Safe'}.`;
    return {
      outcome: 'missed',
      title: `${said} ${email.isPhish ? 'It was a phish.' : 'It was legit.'}`,
      text: email.isPhish ? 'The giveaways:' : 'Why it was fine:',
      visual: (
        <div className="ps-lesson-card">
          <EmailCard email={email} highlights={tells} />
        </div>
      ),
      detail: <Giveaways email={email} tells={tells} />,
    };
  });
  return {
    score: state.score,
    complete: !gameOver,
    title: gameOver ? 'Game over' : 'Run complete!',
    reason: gameOver
      ? undefined
      : state.endReason === 'time-up'
        ? `Time's up! Each run lasts ${Math.round(cfg.runCap.maxTimeMs / 1000)} seconds.`
        : `You got through all ${state.deck.length} emails.`,
    stats: [
      { label: 'Level', value: cfg.tiers[state.tier].label },
      { label: 'Correct', value: `${correctCount(state)} / ${state.history.length}` },
      { label: 'Best streak', value: String(state.bestStreak) },
    ],
    lessons,
    board: state.tier,
  };
}

/**
 * Phish or Safe?: pick a level, then swipe each email left (phish) or right (safe), or tap the buttons beside it.
 * Three strikes end the run. After 5 emails it carries on into the time trial, with a timer that shrinks every card.
 * Ported from the standalone game (../Spot-The-Fish). Its leaderboards, prize draw and admin panel are the shell's
 * now (a board per level, from the result's `board`); its sound and demo aren't here yet.
 */
export function Play({ onFinish, replay }: PlayProps) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    replay && lastTier
      ? gameReducer(initialGameState, { type: 'START', tier: lastTier, deck: deckFor(lastTier) })
      : initialGameState,
  );
  const cardShownAt = useRef(0);
  const email = currentEmail(state);
  const answer = state.screen === 'feedback' ? lastAnswer(state) : undefined;
  const timed = isTimed(state);
  const cardTimeMs = currentCardTimeMs(state);

  const start = (tier: TierId) => {
    lastTier = tier;
    dispatch({ type: 'START', tier, deck: deckFor(tier) });
  };
  const answerWith = (guess: Verdict) =>
    dispatch({ type: 'ANSWER', guess, elapsedMs: performance.now() - cardShownAt.current });

  // Start the clock when a card appears; on a timed card (overtime), an unanswered card times out into a strike.
  useEffect(() => {
    if (state.screen !== 'playing') return;
    cardShownAt.current = performance.now();
    if (!timed) return;
    const id = window.setTimeout(() => dispatch({ type: 'TIMEOUT' }), cardTimeMs);
    return () => window.clearTimeout(id);
  }, [state.screen, state.index, cardTimeMs, timed]);

  // Hold the Correct!/Strike! flash, then move on to the next email (or the end).
  const lastCorrect = lastAnswer(state)?.correct;
  useEffect(() => {
    if (state.screen !== 'feedback') return;
    const id = window.setTimeout(
      () => dispatch({ type: 'NEXT' }),
      lastCorrect ? cfg.feedback.correctMs : cfg.feedback.wrongMs,
    );
    return () => window.clearTimeout(id);
  }, [state.screen, state.index, lastCorrect]);

  useEffect(() => {
    if (state.screen === 'results') onFinish(toResult(state));
  }, [state, onFinish]);

  // Keyboard: ← = Phish, → = Safe. Held keys don't auto-repeat into the next card.
  useEffect(() => {
    if (state.screen !== 'playing') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft') answerWith('phish');
      else if (e.key === 'ArrowRight') answerWith('safe');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.screen]);

  if (state.screen === 'title') {
    return (
      <>
        <Header title={cfg.title} />
        <main className="screen">
          <section className="tier-picker" aria-labelledby="tier-picker-title">
            <h1 id="tier-picker-title" className="tier-picker__heading">
              Pick your level
            </h1>
            <div className="tier-picker__options">
              {TIER_IDS.map((id, i) => (
                <button key={id} type="button" className="btn btn--tier" onClick={() => start(id)} autoFocus={i === 0}>
                  <span className="tier-picker__label">{cfg.tiers[id].label}</span>
                  <span className="tier-picker__hint">{cfg.tiers[id].hint}</span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </>
    );
  }

  if (!email) return null;
  const announcement = answer ? Object.values(feedbackText(answer, email)).join(' ') : '';
  // Read when the card leaves (the moment it's answered), so the last answer is the one given to it.
  const exitTo = lastAnswer(state)?.guess ?? null;

  return (
    // reducedMotion="user": with prefers-reduced-motion, cards fade instead of flying (dragging still works).
    <MotionConfig reducedMotion="user">
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <StrikeIndicator strikes={state.strikes} max={cfg.maxStrikes} />
      </Header>
      <main className="ps-game">
        <p className="ps-game__progress">
          Email {state.index + 1}
          {inOvertime(state) ? (
            <span className="ps-game__overtime">Time trial!</span>
          ) : (
            ` of ${Math.min(state.deck.length, cfg.runCap.maxEmails)}`
          )}
          <span className="ps-game__level">{cfg.tiers[state.tier].label}</span>
        </p>
        {timed && <TimerBar key={state.index} durationMs={cardTimeMs} running={!answer} />}
        <div className="ps-stage">
          <div className="ps-card-area">
            {/* The card flies off as soon as it's answered; the verdict shows in its place until the next one.
                popLayout: the leaving card is lifted out of the layout, so the next one doesn't wait or jump. */}
            <AnimatePresence mode="popLayout" initial={false} custom={exitTo}>
              {!answer && (
                <motion.div key={email.id} className="ps-card-slot" custom={exitTo} variants={cardExit} exit="exit">
                  <SwipeCard email={email} onAnswer={answerWith} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {answer && <FeedbackBanner answer={answer} email={email} />}
        </div>
        {/* Beside the card on landscape screens (they double as swipe-direction hints); a slim row on phones. */}
        <AnswerButtons onAnswer={answerWith} locked={answer !== undefined} />
        <p className="sr-only" role="status">
          {announcement}
        </p>
      </main>
    </MotionConfig>
  );
}
