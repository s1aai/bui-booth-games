import type { TierConfig } from './config';
import type { Email } from './schema';
import type { Rng } from '../../shell/rng';

/**
 * The emails for one run, in play order: at most `maxEmails`, each at most once, so nothing repeats.
 * The order is a weighted shuffle (Efraimidis-Spirakis): at every draw, an email whose difficulty has
 * three times the weight is three times as likely to come next. Difficulties weighted 0 are never dealt.
 */
export function buildDeck(
  emails: readonly Email[],
  weights: TierConfig['poolWeights'],
  maxEmails: number,
  rng: Rng = Math.random,
): Email[] {
  return emails
    .filter((email) => weights[email.difficulty] > 0)
    .map((email) => ({ email, key: rng() ** (1 / weights[email.difficulty]) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, maxEmails)
    .map(({ email }) => email);
}

/**
 * Overtime: the deck carried on until it holds `total` emails. The tier's emails not dealt yet come first,
 * then the whole pool again, reshuffled each round. A round never starts with the email just played.
 */
export function extendDeck(
  deck: readonly Email[],
  emails: readonly Email[],
  weights: TierConfig['poolWeights'],
  total: number,
  rng: Rng = Math.random,
): Email[] {
  const out = [...deck];
  const dealt = new Set(deck.map((email) => email.id));
  let pool: readonly Email[] = emails.filter((email) => !dealt.has(email.id));
  while (out.length < total) {
    const round = buildDeck(pool, weights, Infinity, rng);
    if (round.length === 0 && pool === emails) break; // this tier has no emails at all
    if (round.length > 1 && round[0].id === out[out.length - 1]?.id) round.push(round.shift()!);
    out.push(...round);
    pool = emails;
  }
  return out.slice(0, total);
}
