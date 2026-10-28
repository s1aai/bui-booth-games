import { GOLF_CONFIG, type GolfConfig } from './config';
import type { Hole, Rect } from './data';

const inside = (p: { x: number; y: number }, r: Rect, pad = 0) =>
  p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + pad;

/** Checks the holes at startup. Returns one message per problem; empty means all fine. */
export function validateHoles(holes: readonly Hole[], cfg: GolfConfig = GOLF_CONFIG): string[] {
  const problems: string[] = [];
  if (holes.length === 0) problems.push('There are no holes.');
  holes.forEach((h, i) => {
    const name = `Hole ${i + 1} ("${h.name}")`;
    if (h.par < 1) problems.push(`${name}: par must be at least 1.`);
    const points = [h.start, h.hole, ...h.tunnels.flatMap((t) => [t.from, t.to])];
    for (const p of points) {
      if (p.x < 0 || p.y < 0 || p.x > cfg.width || p.y > cfg.height) problems.push(`${name}: a point is off the course.`);
      if (h.walls.some((w) => inside(p, w, cfg.ballRadius))) problems.push(`${name}: a start, hole or tunnel end is inside a wall.`);
    }
    if (h.sniffers.some((s) => inside(h.start, s) || inside(h.hole, s))) problems.push(`${name}: the start or hole is inside a sniffer zone.`);
    if (h.tunnels.some((t) => h.sniffers.some((s) => inside(t.to, s, cfg.tunnelRadius)))) problems.push(`${name}: a tunnel comes out inside a sniffer zone.`);
    const clear = cfg.tunnelRadius + cfg.holeRadius;
    if (h.tunnels.some((t) => [t.from, t.to].some((e) => [h.start, h.hole].some((p) => Math.hypot(p.x - e.x, p.y - e.y) < clear)))) {
      problems.push(`${name}: a tunnel end is on top of the start or the hole.`);
    }
  });
  return problems;
}
