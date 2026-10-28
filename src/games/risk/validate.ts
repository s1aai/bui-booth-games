import { RISK_CONFIG, type RiskConfig } from './config';
import type { Scene } from './scenes';

/** Smallest risk circle, in scene units: about a fingertip at the booth's screen size. */
const MIN_RADIUS = 40;
const MAX_LABEL = 40;
const MAX_TIP = 110;

/**
 * Checks the scenes at startup. Returns one message per problem; empty means all fine.
 * `artIds` are the scenes that have art in sceneArt.tsx.
 */
export function validateScenes(scenes: readonly Scene[], artIds: readonly string[], cfg: RiskConfig = RISK_CONFIG): string[] {
  const problems: string[] = [];
  const sceneIds = new Set<string>();
  for (const scene of scenes) {
    const name = `Scene "${scene.id}"`;
    if (sceneIds.has(scene.id)) problems.push(`${name}: listed twice.`);
    sceneIds.add(scene.id);
    if (!artIds.includes(scene.id)) problems.push(`${name}: has no art in sceneArt.tsx.`);
    if (scene.hotspots.length === 0) problems.push(`${name}: has no risks.`);

    const ids = new Set<string>();
    for (const spot of scene.hotspots) {
      const where = `${name}, risk "${spot.id}"`;
      if (ids.has(spot.id)) problems.push(`${where}: listed twice.`);
      ids.add(spot.id);
      if (!spot.label.trim() || spot.label.length > MAX_LABEL) problems.push(`${where}: the label must be 1-${MAX_LABEL} characters.`);
      if (!spot.tip.trim() || spot.tip.length > MAX_TIP) problems.push(`${where}: the tip must be 1-${MAX_TIP} characters.`);
      if (spot.r < MIN_RADIUS) problems.push(`${where}: radius ${spot.r} is too small to tap (at least ${MIN_RADIUS}).`);
      if (spot.x - spot.r < 0 || spot.y - spot.r < 0 || spot.x + spot.r > scene.width || spot.y + spot.r > scene.height) {
        problems.push(`${where}: its circle goes outside the scene.`);
      }
    }

    // Overlapping circles (with the touch slop) would make a tap between them ambiguous.
    scene.hotspots.forEach((a, i) => {
      for (const b of scene.hotspots.slice(i + 1)) {
        if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 2 * cfg.touchSlop) {
          problems.push(`${name}: risks "${a.id}" and "${b.id}" overlap.`);
        }
      }
    });
  }
  return problems;
}
