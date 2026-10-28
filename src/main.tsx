import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/poppins/latin-800.css';
import './shell/styles/theme.css';
import './shell/styles/shell.css';
// The games in this build (all of them for the arcade, or one: see vite.config.ts), after the shell's CSS so the
// games' own styles come later in the page.
import games from 'virtual:games';
import { ErrorBoundary } from './shell/components/ErrorBoundary';
import { SHELL_CONFIG } from './shell/config';
import { Shell } from './shell/Shell';
import { applyTheme, loadTheme } from './shell/theme';

document.title = games.length > 1 ? SHELL_CONFIG.arcade.title : games[0].title;

// Set the theme before the first render so the page never flashes the wrong colours.
applyTheme(loadTheme(), false);

// Kiosk: no right-click menu. On a touchscreen, a long press counts as a right-click and would open
// Chrome's menu over the game.
window.addEventListener('contextmenu', (e) => e.preventDefault());

// A held Enter (or Space) repeats, and each repeat would press whichever button has focus next: in Phish or Safe
// it raced from Start through the guide into a game. Only the first press counts.
window.addEventListener(
  'keydown',
  (e) => {
    if (e.repeat && (e.key === 'Enter' || e.key === ' ')) e.preventDefault();
  },
  true,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Shell games={games} />
    </ErrorBoundary>
  </StrictMode>,
);
