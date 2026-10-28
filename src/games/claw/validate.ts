import type { ItemKind } from './data';

const MAX_LABEL = 14;
const MAX_WHY = 130;

/** Checks the item kinds at startup. Returns one message per problem; empty means all fine. */
export function validateItems(kinds: readonly ItemKind[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const kind of kinds) {
    const name = `"${kind.id}"`;
    if (ids.has(kind.id)) problems.push(`${name}: listed twice.`);
    ids.add(kind.id);
    if (!kind.label.trim() || kind.label.length > MAX_LABEL) problems.push(`${name}: the label must be 1-${MAX_LABEL} characters.`);
    if (!kind.why.trim() || kind.why.length > MAX_WHY) problems.push(`${name}: "why" must be 1-${MAX_WHY} characters.`);
    if (kind.weights.some((w) => w < 0)) problems.push(`${name}: weights can't be negative.`);
    if (kind.good && (kind.points <= 0 || kind.strike)) problems.push(`${name}: a good item scores points and is never a strike.`);
    if (!kind.good && kind.points !== 0) problems.push(`${name}: a bad item scores no points.`);
  }
  // Both parts of the round need something to grab and something to avoid.
  for (const level of [0, 1]) {
    for (const good of [true, false]) {
      if (!kinds.some((k) => k.good === good && k.weights[level] > 0)) {
        problems.push(`Part ${level + 1} of the round has no ${good ? 'good' : 'bad'} items: give one a weight.`);
      }
    }
  }
  return problems;
}
