import { Component, type ReactNode } from 'react';
import { SHELL_CONFIG } from '../config';

interface State {
  failed: boolean;
}

/**
 * Last line of defence for an unattended kiosk: if anything crashes, show a friendly screen and
 * reload the game after SHELL_CONFIG.kiosk.crashReloadMs (or on a tap) instead of leaving a blank page.
 * Settings are in localStorage, so a reload keeps them.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(error);
    window.setTimeout(() => window.location.reload(), SHELL_CONFIG.kiosk.crashReloadMs);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="app">
        <main className="screen crash" onClick={() => window.location.reload()}>
          <h1 className="crash__title">Oops, something went wrong</h1>
          <p>The game is restarting. Tap to restart now.</p>
        </main>
      </div>
    );
  }
}
