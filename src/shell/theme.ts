import { SHELL_CONFIG, type ShellConfig } from './config';

export type Theme = ShellConfig['defaultTheme'];

/** Shared by all the games: they run in the same kiosk browser profile. */
const STORAGE_KEY = 'bui-booth:theme';

/** The theme saved by the header toggle on this device, or the configured default. */
export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage blocked (e.g. private window): fall through to the default.
  }
  return SHELL_CONFIG.defaultTheme;
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Applies a theme to the page (theme.css keys off <html data-theme>) and remembers it. */
export function applyTheme(theme: Theme, remember = true): void {
  document.documentElement.dataset.theme = theme;
  if (!remember) return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage blocked: the theme still applies until the page reloads.
  }
}
