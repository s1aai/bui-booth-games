import { describe, expect, it } from 'vitest';
import { RISK_CONFIG, type RiskConfig } from './config';
import { createRiskReducer, hitTest, initialRiskState, riskScore, type RiskState } from './logic';
import { SCENE_ART } from './sceneArt';
import { SCENES, type Scene } from './scenes';
import { validateScenes } from './validate';

const scene: Scene = {
  id: 'test',
  title: 'Test',
  width: 1000,
  height: 600,
  hotspots: [
    { id: 'a', label: 'A', tip: 'Tip A', x: 200, y: 200, r: 50 },
    { id: 'b', label: 'B', tip: 'Tip B', x: 600, y: 300, r: 80 },
  ],
};
const cfg: RiskConfig = { ...RISK_CONFIG, roundMs: 60_000, missPenaltyMs: 3_000, touchSlop: 10, maxTickMs: 100 };
const reducer = createRiskReducer(scene, cfg);
const start = initialRiskState(cfg);
const tap = (state: RiskState, x: number, y: number) => reducer(state, { type: 'TAP', x, y });

describe('hitTest', () => {
  it('finds the risk whose circle holds the point, with the touch slop', () => {
    expect(hitTest(scene, 200, 200)?.id).toBe('a');
    expect(hitTest(scene, 250, 200)?.id).toBe('a');
    expect(hitTest(scene, 255, 200)).toBeNull();
    expect(hitTest(scene, 255, 200, 10)?.id).toBe('a');
    expect(hitTest(scene, 900, 50, 10)).toBeNull();
  });

  it('picks the nearest when two are in reach', () => {
    const close: Scene = { ...scene, hotspots: [scene.hotspots[0], { ...scene.hotspots[0], id: 'c', x: 290 }] };
    expect(hitTest(close, 260, 200)?.id).toBe('c');
  });
});

describe('riskReducer', () => {
  it('finds a risk once; tapping it again costs nothing', () => {
    const once = tap(start, 205, 195);
    expect(once.found).toEqual(['a']);
    const again = tap(once, 200, 200);
    expect(again).toBe(once);
  });

  it('a tap on nothing costs time and is remembered', () => {
    const state = tap(start, 900, 50);
    expect(state.timeLeftMs).toBe(57_000);
    expect(state.misses).toEqual([{ x: 900, y: 50 }]);
  });

  it('ends with a time bonus when every risk is found', () => {
    const state = tap(tap(start, 200, 200), 600, 300);
    expect(state.over).toBe(true);
    expect(state.endReason).toBe('all-found');
    expect(riskScore(state, cfg)).toBe(2 * cfg.pointsPerRisk + 60 * cfg.timeBonusPerSecond);
  });

  it("ends when time runs out, with no bonus, and then ignores everything", () => {
    let state = tap(start, 200, 200);
    for (let i = 0; i < 600; i++) state = reducer(state, { type: 'TICK', ms: 100 });
    expect(state.over).toBe(true);
    expect(state.endReason).toBe('time-up');
    expect(state.timeLeftMs).toBe(0);
    expect(riskScore(state, cfg)).toBe(cfg.pointsPerRisk);
    expect(tap(state, 600, 300)).toBe(state);
  });

  it('a wrong tap can run the clock out', () => {
    const state = tap({ ...start, timeLeftMs: 2_000 }, 900, 50);
    expect(state.over).toBe(true);
    expect(state.endReason).toBe('time-up');
  });

  it('caps a long tick, so a stalled window does not lose the round', () => {
    expect(reducer(start, { type: 'TICK', ms: 30_000 }).timeLeftMs).toBe(60_000 - cfg.maxTickMs);
  });
});

describe('scenes', () => {
  it('pass the startup validator', () => {
    expect(validateScenes(SCENES, Object.keys(SCENE_ART))).toEqual([]);
  });

  it('the office has the 8 risks from the plan', () => {
    expect(SCENES[0].hotspots).toHaveLength(8);
  });

  it('the validator catches overlaps, tiny or off-scene circles, and missing art', () => {
    const bad: Scene = {
      ...scene,
      hotspots: [
        { id: 'a', label: 'A', tip: 'Tip', x: 100, y: 100, r: 60 },
        { id: 'b', label: 'B', tip: 'Tip', x: 150, y: 120, r: 60 },
        { id: 'c', label: 'C', tip: 'Tip', x: 500, y: 300, r: 20 },
        { id: 'd', label: 'D', tip: 'Tip', x: 990, y: 300, r: 50 },
      ],
    };
    const problems = validateScenes([bad], []).join('\n');
    expect(problems).toMatch(/no art/);
    expect(problems).toMatch(/"a" and "b" overlap/);
    expect(problems).toMatch(/"c": radius 20 is too small/);
    expect(problems).toMatch(/"d": its circle goes outside/);
  });
});
