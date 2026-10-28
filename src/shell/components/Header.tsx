import type { ReactNode } from 'react';
import logoOnDark from '../assets/bui-logo-dark.webp';
import logoOnLight from '../assets/bui-logo-light.png';
import { GameTitle } from './GameTitle';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  /** The game's name beside the logo. The homepage leaves it out because it shows the name large. */
  title?: string;
  /** Score, strikes, time, etc., shown on the right before the theme toggle. */
  children?: ReactNode;
}

export function Header({ title, children }: Props) {
  return (
    <header className="app-header">
      {/* CSS shows the one that suits the current theme. */}
      <img className="logo logo--on-dark" src={logoOnDark} alt="BUI" />
      <img className="logo logo--on-light" src={logoOnLight} alt="BUI" />
      {title && (
        <div className="app-header__title">
          <GameTitle text={title} />
        </div>
      )}
      <div className="app-header__hud">
        {children}
        <ThemeToggle />
      </div>
    </header>
  );
}

/** A labelled figure in the header, e.g. Score 1,200. */
export function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">{children}</span>
    </div>
  );
}
