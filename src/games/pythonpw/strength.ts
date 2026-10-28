import { TYPES, type CharType } from './data';

export const YEAR = 31557600;

/** The goals, in order: how long the password takes to crack (log10 of seconds) to reach each one. */
export const GOALS = [
  { log: Math.log10(86400), label: '1 day' },
  { log: Math.log10(YEAR), label: '1 year' },
  { log: Math.log10(YEAR * 1e3), label: '1,000 years' },
  { log: Math.log10(YEAR * 1e6), label: '1 million years' },
  { log: Math.log10(YEAR * 1e9), label: '1 billion years' },
  { log: Math.log10(YEAR * 1.38e10), label: 'older than the universe' },
];

/** The nth goal, from 1. Past the end, the last one. */
export function goalFor(n: number) {
  return GOALS[Math.min(n - 1, GOALS.length - 1)];
}

/**
 * log10 of the seconds a 10-billion-guesses-a-second computer needs: length times the log of the pool of
 * characters the password could be drawn from. Pool = the sizes of each kind used.
 */
export function crackLog(chars: readonly { type: CharType }[]): number {
  if (chars.length === 0) return -Infinity;
  const kinds = new Set(chars.map((c) => c.type));
  let pool = 0;
  kinds.forEach((t) => (pool += TYPES[t].size));
  return chars.length * Math.log10(pool) - 10;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** A crack time in words, e.g. "3 years" or "older than the universe". */
export function fmtCrack(log: number): string {
  if (!isFinite(log) || log < 0) return 'less than a second';
  const s = 10 ** log;
  if (s < 60) return plural(Math.max(1, Math.round(s)), 'second');
  if (s < 3600) return plural(Math.round(s / 60), 'minute');
  if (s < 86400) return plural(Math.round(s / 3600), 'hour');
  const y = s / YEAR;
  if (y < 1) return plural(Math.round(s / 86400), 'day');
  if (y < 1e3) return plural(Math.round(y), 'year');
  if (y < 1e6) return `${Math.round(y / 1e3)} thousand years`;
  if (y < 1e9) return `${Math.round(y / 1e6)} million years`;
  if (y < 1.38e10) return `${Math.round(y / 1e9)} billion years`;
  return 'older than the universe';
}
