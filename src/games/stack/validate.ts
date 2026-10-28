import type { BlockKind } from './data';

const MAX_LABEL = 14;

/** Checks the block kinds at startup. Returns one message per problem; empty means all fine. */
export function validateBlocks(blocks: readonly BlockKind[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const block of blocks) {
    const name = `"${block.id}"`;
    if (ids.has(block.id)) problems.push(`${name}: listed twice.`);
    ids.add(block.id);
    if (!block.label.trim() || block.label.length > MAX_LABEL) problems.push(`${name}: the label must be 1-${MAX_LABEL} characters.`);
    if (block.points < 0 || block.weight <= 0) problems.push(`${name}: points can't be negative, and the weight must be above 0.`);
  }
  for (const role of ['data', 'service', 'protect']) {
    if (!blocks.some((b) => b.role === role)) problems.push(`There's no "${role}" block.`);
  }
  // A database always needs a choice of cover, and defence in depth needs two different protect blocks.
  if (blocks.filter((b) => b.role === 'protect').length < 2) problems.push('There must be at least 2 "protect" blocks.');
  return problems;
}
