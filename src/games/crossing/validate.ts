import type { CrossingConfig } from './config';

/** Checks the field layout at startup. Returns one message per problem; empty means all fine. */
export function validateField(cfg: CrossingConfig): string[] {
  const problems: string[] = [];
  if (cfg.rows < 4) problems.push('The field needs at least 4 rows.');
  if (cfg.startRow <= 0 || cfg.startRow >= cfg.rows) problems.push('The start row must be below the secure route (row 0) and on the field.');
  if (cfg.lanes.length === 0) problems.push('The field needs at least one lane.');
  cfg.lanes.forEach((lane, i) => {
    if (lane.type !== 'router' && (lane.speed <= 0 || lane.gap < 1)) {
      problems.push(`Lane ${i + 1}: threats need a speed above 0 and a gap of at least 1 row.`);
    }
  });
  if (cfg.lanes.some((l) => l.type === 'router') && cfg.hackedPerRouterLane >= cfg.rows - 1) {
    problems.push('Too many hacked routers: every router column needs at least one safe router.');
  }
  if (cfg.secureHopMs <= cfg.hopMs) problems.push('The secure route must be slower than the open one (secureHopMs above hopMs).');
  return problems;
}
