import { SEGMENT_CONFIG, type SegmentConfig } from './config';
import type { LinkKind } from './data';

/** Checks the link kinds and rounds at startup. Returns one message per problem; empty means all fine. */
export function validateSegment(kinds: readonly LinkKind[], cfg: SegmentConfig = SEGMENT_CONFIG): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const kind of kinds) {
    if (ids.has(kind.id)) problems.push(`Link "${kind.id}" is listed twice.`);
    ids.add(kind.id);
    if (!kind.device.trim() || !kind.network.trim() || !kind.why.trim()) {
      problems.push(`Link "${kind.id}" needs a device, a network and a reason.`);
    }
  }
  if (cfg.rounds.length === 0) problems.push('There are no rounds.');
  cfg.rounds.forEach((round, i) => {
    const name = `Round ${i + 1}`;
    if (round.links > kinds.length) problems.push(`${name} needs ${round.links} links, but only ${kinds.length} kinds exist.`);
    if (round.links * cfg.minLinkLength > round.size * round.size) {
      problems.push(`${name}: ${round.links} links of ${cfg.minLinkLength}+ squares can't fit a ${round.size} x ${round.size} grid.`);
    }
    if (round.links < 2) problems.push(`${name} needs at least 2 links.`);
  });
  return problems;
}
