import { SHELL_CONFIG } from '../config';
import type { ScoreEntry } from '../leaderboard';
import type { GameModule, GameResult } from '../types';
import { Header } from './Header';
import { Icon } from './Icon';
import { Leaderboard } from './Leaderboard';

interface Props {
  game: GameModule;
  result: GameResult;
  /** The top of the run's leaderboard. */
  topScores: readonly ScoreEntry[];
  /** The board's name, e.g. Phish or Safe's level; empty for a game with one board. */
  boardLabel: string;
  /** Where this run landed on the board (1 = top), or null if it didn't make it. */
  rank: number | null;
  onPlayAgain: () => void;
  onHome: () => void;
  /** The Home button's label: "More games" in the arcade. */
  homeLabel?: string;
}

/**
 * After the run: the score and figures on the left; the top scores and what to remember on the right (stacked on
 * narrow screens).
 */
export function EndScreen({ game, result, topScores, boardLabel, rank, onPlayAgain, onHome, homeLabel = 'Home' }: Props) {
  const scoresTitle = boardLabel ? `Top scores: ${boardLabel}` : 'Top scores';
  return (
    <>
      <Header title={game.title} />
      <main className="screen end-screen" aria-labelledby="end-title">
        <div className="end-screen__summary">
          <h1
            id="end-title"
            className={`end-screen__title ${result.complete ? 'end-screen__title--complete' : 'end-screen__title--over'}`}
          >
            <Icon name={result.complete ? 'check' : 'cross'} />
            {result.title}
          </h1>
          {result.reason && <p className="end-screen__reason">{result.reason}</p>}

          <div className="end-screen__score">
            <span className="end-screen__score-label">Final score</span>
            <span className="end-screen__score-value">{result.score.toLocaleString()}</span>
          </div>
          {rank !== null && <p className="end-screen__rank">You're #{rank} on the board!</p>}

          <dl className="end-screen__stats">
            {result.stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>

          <div className="end-screen__actions">
            <button type="button" className="btn btn--primary btn--hero" onClick={onPlayAgain} autoFocus>
              Play again
            </button>
            <button type="button" className="btn btn--ghost" onClick={onHome}>
              {homeLabel}
            </button>
          </div>
          <p className="end-screen__cta">{SHELL_CONFIG.cta}</p>
        </div>

        <div className="end-screen__side">
          <section className="end-screen__part" aria-labelledby="end-scores-title">
            <h2 id="end-scores-title" className="end-screen__side-title">
              {scoresTitle}
            </h2>
            <Leaderboard entries={topScores} label={scoresTitle} highlightRank={rank} />
          </section>
          <section className="end-screen__part" aria-labelledby="end-takeaways-title">
            <h2 id="end-takeaways-title" className="end-screen__side-title">
              Remember
            </h2>
            <ul className="takeaways">
              {game.takeaways.map((takeaway) => (
                <li key={takeaway} className="takeaways__item">
                  <Icon name="check" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
