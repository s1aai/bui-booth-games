import { useEffect, type MouseEvent } from 'react';
import type { GameModule } from '../types';
import { AdminCorner } from './AdminCorner';
import { GameTitle } from './GameTitle';
import { Header } from './Header';
import { HomeBackground } from './HomeBackground';

interface Props {
  game: GameModule;
  onStart: () => void;
}

/**
 * The homepage, and the idle screen between players: the game's name, the invitation, and Start.
 * A tap anywhere (or a key press) starts, except on other buttons such as the theme toggle, and on the hidden admin
 * corner (top left).
 */
export function HomeScreen({ game, onStart }: Props) {
  // Any key starts, unless another button (e.g. the theme toggle) has focus or the admin keypad or panel is open.
  // keyup, not keydown, so the same key press can't also activate the button that appears next. And only a key that
  // went down here: not one held from the screen before, or one that closed the admin keypad (a wrong PIN, Esc).
  // The keydown is checked first (capture), before the keypad's own handler can close it.
  useEffect(() => {
    let keyDown = false;
    const onKeyDown = () => {
      keyDown = !document.querySelector('[role="dialog"]');
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!keyDown) return;
      keyDown = false;
      if (['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const focused = document.activeElement;
      if (focused && focused !== document.body && !focused.classList.contains('home__prompt')) return;
      onStart();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [onStart]);

  const onClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('button')) return;
    onStart();
  };

  return (
    <>
      <Header />
      <AdminCorner games={[game]} />
      <HomeBackground icons={game.homeIcons} />
      <main className="screen home" onClick={onClick}>
        <div className="home__panel">
          <h1 className="home__title">
            <GameTitle text={game.title} />
          </h1>
          <p className="home__tagline">{game.tagline}</p>
          <button type="button" className="btn btn--primary btn--hero home__prompt" onClick={onStart} autoFocus>
            Start
          </button>
        </div>
      </main>
    </>
  );
}
