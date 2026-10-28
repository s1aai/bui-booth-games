import { PASSWORD_CONFIG, type PasswordConfig } from './config';
import type { PasswordEntry } from './data';
import { passphraseLog10Guesses, randomLog10Guesses, strength } from './logic';

/** Longest password that still fits its card at the booth. */
const MAX_TEXT = 40;
const MAX_WHY = 120;
/** How far an authored number may be from the recomputed one (the data holds two decimals). */
const TOLERANCE = 0.01;

/**
 * Checks the passwords at startup. Returns one message per problem; an empty list means the content is fine.
 * zxcvbn's numbers for the common and pattern ones are checked by data.test.ts instead, so zxcvbn stays out of
 * the game itself.
 */
export function validatePasswords(entries: readonly PasswordEntry[], cfg: PasswordConfig = PASSWORD_CONFIG): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const name = `"${entry.text}"`;
    if (!entry.text || /\s/.test(entry.text)) problems.push(`${name}: empty or has spaces.`);
    if (entry.text.length > MAX_TEXT) problems.push(`${name}: longer than ${MAX_TEXT} characters.`);
    if (seen.has(entry.text)) problems.push(`${name}: listed twice.`);
    seen.add(entry.text);
    if (!entry.why.trim() || entry.why.length > MAX_WHY) problems.push(`${name}: "why" must be 1-${MAX_WHY} characters.`);
    if (!Number.isFinite(entry.log10Guesses) || entry.log10Guesses < 0) {
      problems.push(`${name}: log10Guesses must be a number of 0 or more.`);
      continue;
    }

    let expected: number | null = null;
    if (entry.kind === 'random') expected = randomLog10Guesses(entry.text);
    if (entry.kind === 'passphrase') {
      if (!/^[a-z]+(-[a-z]+)+$/.test(entry.text)) problems.push(`${name}: a passphrase is lowercase words joined by -.`);
      expected = passphraseLog10Guesses(entry.text.split('-').length, cfg.wordListSize);
    }
    if (expected !== null && Math.abs(entry.log10Guesses - expected) > TOLERANCE) {
      problems.push(`${name}: log10Guesses should be ${expected.toFixed(2)} for a ${entry.kind} password.`);
    }
  }

  const strengths = entries.map((entry) => strength(entry, cfg));
  if (Math.max(...strengths) - Math.min(...strengths) < cfg.gap.startOrders) {
    problems.push(`The passwords' crack times must span at least ${cfg.gap.startOrders} orders of magnitude.`);
  }
  return problems;
}
