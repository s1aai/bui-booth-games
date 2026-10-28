import { useMemo } from 'react';
import { SHELL_CONFIG } from '../config';
import { bestFor, type Leaderboards } from '../leaderboard';
import type { GameModule } from '../types';
import { GameTitle } from './GameTitle';
import { Header } from './Header';
import { HomeBackground } from './HomeBackground';
import { Icon } from './Icon';

export const KIND_LABEL: Record<GameModule['kind'], string> = { arcade: 'Arcade', hybrid: 'Hybrid', learn: 'Learn' };

interface Props {
  games: readonly GameModule[];
  /** The saved leaderboards, for each tile's best score. */
  boards: Leaderboards;
  onPick: (game: GameModule) => void;
}

/**
 * The arcade's game menu (after the prize draw question, or its idle screen when the question is switched off): a big
 * tile per game with its best score, plus "Surprise me" for anyone who can't decide. Picking a game goes to its
 * how-to guide.
 */
export function MenuScreen({ games, boards, onPick }: Props) {
  const icons = useMemo(() => games.map((game) => game.homeIcons[0]), [games]);
  const { title, tagline } = SHELL_CONFIG.arcade;

  return (
    <>
      <Header />
      <HomeBackground icons={icons} />
      <main className="screen menu" aria-labelledby="menu-title">
        <div className="menu__intro">
          <h1 id="menu-title" className="menu__title">
            <GameTitle text={title} />
          </h1>
          <p className="menu__tagline">{tagline}</p>
        </div>
        <ul className="menu__games">
          {games.map((game, i) => {
            const best = bestFor(boards, game);
            return (
              <li key={game.id}>
                <button type="button" className="menu-tile" onClick={() => onPick(game)} autoFocus={i === 0}>
                  <span className="menu-tile__icon" aria-hidden="true">
                    <Icon name={game.homeIcons[0]} />
                  </span>
                  <span className="menu-tile__text">
                    <span className="menu-tile__title">
                      <GameTitle text={game.title} />
                    </span>
                    <span className="menu-tile__meta">
                      <span className={`menu-tile__kind menu-tile__kind--${game.kind}`}>{KIND_LABEL[game.kind]}</span>
                      {/* There's no room for both: once the game has a best score, it shows instead of the topic. */}
                      {best ? (
                        <span className="menu-tile__best">
                          Best {best.initials} {best.score.toLocaleString()}
                        </span>
                      ) : (
                        <span className="menu-tile__teaches">{game.teaches}</span>
                      )}
                    </span>
                    <span className="menu-tile__tagline">{game.tagline}</span>
                  </span>
                  <span className="menu-tile__go" aria-hidden="true">
                    <Icon name="arrow-right" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="btn btn--ghost menu__surprise"
          onClick={() => onPick(games[Math.floor(Math.random() * games.length)])}
        >
          Surprise me
        </button>
      </main>
    </>
  );
}
