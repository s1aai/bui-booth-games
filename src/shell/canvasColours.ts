const cache = new Map<string, string>();

/**
 * A canvas can't read var(), so a theme token is looked up once and kept. Tokens are plain hex values in theme.css.
 */
export function themeColour(token: string): string {
  let value = cache.get(token);
  if (value === undefined) {
    value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    cache.set(token, value);
  }
  return value;
}

/** A theme colour at a given opacity, for canvas fills and strokes. */
export function fade(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
