export const INITIALS_LENGTH = 3;

/**
 * Initials that can't go on the leaderboard. Three capital letters each; add more as needed.
 * The initials screen asks for different letters when someone enters one of these.
 */
export const BLOCKED_INITIALS: readonly string[] = [
  'ANL', 'ASS', 'CNT', 'COK', 'CUM', 'CUK', 'DIC', 'DIK', 'DIX', 'DMN', 'FAG', 'FAP', 'FCK', 'FKU', 'FUC', 'FUK',
  'FUQ', 'JIZ', 'KKK', 'KUM', 'NAZ', 'NGR', 'NIG', 'PIS', 'PNS', 'POO', 'SEX', 'SHT', 'SLT', 'STD', 'SUX',
  'TIT', 'TWT', 'VAG', 'WTF', 'XXX',
];

/** What's typed in the initials box, kept to capital letters A-Z, at most three. */
export function cleanInitials(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, INITIALS_LENGTH);
}

export function isComplete(initials: string): boolean {
  return initials.length === INITIALS_LENGTH;
}

export function isBlocked(initials: string): boolean {
  return BLOCKED_INITIALS.includes(initials.toUpperCase());
}
