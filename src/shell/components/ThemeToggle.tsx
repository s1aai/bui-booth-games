import { useState } from 'react';
import { applyTheme, currentTheme, type Theme } from '../theme';
import { Icon } from './Icon';

/** Round sun/moon button, like the one on BUI's website. The icon shows the mode you'll switch to. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;

  const toggle = () => {
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={label} title={label}>
      <Icon name={next === 'light' ? 'sun' : 'moon'} />
    </button>
  );
}
