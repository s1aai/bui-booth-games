import type { GameModule } from '../types';
import { Header } from './Header';
import { Icon } from './Icon';

interface Props {
  game: GameModule;
  onDone: () => void;
  /** Arcade only: back to the menu, for someone who picked the wrong game. */
  onBack?: () => void;
}

/** How to play, shown after Start on the homepage (or a pick on the arcade menu). "Got it" starts the game. */
export function GuideScreen({ game, onDone, onBack }: Props) {
  return (
    <>
      <Header title={game.title} />
      <main className="screen guide" aria-labelledby="guide-title">
        <h1 id="guide-title" className="guide__title">
          How to play
        </h1>
        <p className="guide__teaches">Teaches: {game.teaches}</p>
        <ol className="guide__steps">
          {game.howTo.map((step) => (
            <li key={step.title} className="guide__step">
              <span className="guide__icon" aria-hidden="true">
                <Icon name={step.icon} />
              </span>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
        {game.guideNote && <p className="guide__note">{game.guideNote}</p>}
        <div className="guide__actions">
          <button type="button" className="btn btn--primary btn--hero" onClick={onDone} autoFocus>
            Got it
          </button>
          {onBack && (
            <button type="button" className="btn btn--ghost" onClick={onBack}>
              All games
            </button>
          )}
        </div>
      </main>
    </>
  );
}
