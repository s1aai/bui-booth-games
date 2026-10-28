import { nextRandom } from '../../shell/rng';
import { CLAW_CONFIG, type ClawConfig } from './config';
import { ITEMS, type ItemKind } from './data';

/** An item in the machine, resting in its slot (or held by the claw). */
export interface Item {
  id: number;
  /** Index into the item kinds. */
  kind: number;
  slot: number;
  /** It falls into place from `fallFromY` (drawing units), starting at this game time: when it drops in or slips. */
  fallStartMs: number;
  fallFromY: number;
}

/**
 * idle: waiting for you; aim: you're holding, and the trolley follows your finger; down and up: you let go, so the
 * claw drops down its cable and reels back in; carry: it takes what it caught to the chute; release: it lets go there.
 */
export type ClawPhase = 'idle' | 'aim' | 'down' | 'up' | 'carry' | 'release';

/** What restoring an item did: points, a strike, or nothing (a corrupted file). Also a slip, which restores nothing. */
export interface Outcome {
  kind: number;
  type: 'good' | 'strike' | 'dud' | 'slip';
  points: number;
  atMs: number;
}

export interface ClawState {
  /** Game time so far, in ms. Only TICKs move it, so the reducer never reads a clock. */
  timeMs: number;
  timeLeftMs: number;
  /** The random seed for the next slip or refill, kept in state so the same seed and actions replay the same game. */
  seed: number;
  nextId: number;
  phase: ClawPhase;
  /** The trolley on the rail: where it is, how fast it's moving, and where you're steering it. */
  trolleyX: number;
  trolleyV: number;
  targetX: number;
  /** The claw's swing: the cable's angle from straight down (radians, positive = to the right), and its rate. */
  angle: number;
  angVel: number;
  /** Cable length from the rail to the claw's grip, in drawing units. */
  cable: number;
  /** The item the claw is holding. */
  held: number | null;
  /** If the grab was off-centre and will slip: the cable length where it lets go on the way up. */
  slipAtCable: number | null;
  /** When the claw started letting go over the chute. */
  releaseStartMs: number;
  items: Item[];
  /** Emptied slots, refilled at the given time. */
  refills: { slot: number; atMs: number }[];
  /** When the longest-standing item is next swapped for a fresh one (CLAW_CONFIG.churnMs). */
  nextChurnMs: number;
  score: number;
  strikes: number;
  outcomes: Outcome[];
  over: boolean;
  endReason: 'time' | 'strikes' | null;
}

export type ClawAction =
  /** Game time passed, in ms (from requestAnimationFrame). */
  | { type: 'TICK'; ms: number }
  /** You're holding: steer the trolley towards this x (a finger on the machine, or a held arrow at the edge). */
  | { type: 'AIM'; x: number }
  /** You let go: the claw drops. */
  | { type: 'DROP' };

export const slotX = (slot: number, cfg: ClawConfig = CLAW_CONFIG) => cfg.box.firstSlotX + slot * cfg.box.slotGap;

/** The claw's range: from over the chute to the far wall. */
export function clampX(x: number, cfg: ClawConfig = CLAW_CONFIG): number {
  return Math.min(Math.max(x, cfg.box.chuteX), cfg.box.width - cfg.box.itemSize / 2);
}

/** Picks an item kind for the level (1 or 2), in proportion to its weights. */
export function pickKind(r: number, level: 1 | 2, kinds: readonly ItemKind[] = ITEMS): number {
  const weights = kinds.map((k) => k.weights[level - 1]);
  let x = r * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x < 0) return i;
  }
  return weights.length - 1;
}

/**
 * A full machine to start: half good items and half bad (level 1 kinds), shuffled, so every round starts with
 * plenty worth grabbing.
 */
export function initialClawState(seed: number, cfg: ClawConfig = CLAW_CONFIG, kinds: readonly ItemKind[] = ITEMS): ClawState {
  let s = seed >>> 0;
  let r: number;
  const draw = (good: boolean) => {
    const pool = kinds.map((k, i) => ({ k, i })).filter(({ k }) => k.good === good && k.weights[0] > 0);
    [r, s] = nextRandom(s);
    const sub = pool.map(({ k }) => k);
    return pool[pickKind(r, 1, sub)].i;
  };
  const chosen = Array.from({ length: cfg.box.slots }, (_, i) => draw(i < cfg.box.slots / 2));
  // Shuffle (Fisher-Yates).
  for (let i = chosen.length - 1; i > 0; i--) {
    [r, s] = nextRandom(s);
    const j = Math.floor(r * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return {
    timeMs: 0,
    timeLeftMs: cfg.roundMs,
    seed: s,
    nextId: chosen.length + 1,
    phase: 'idle',
    trolleyX: cfg.box.chuteX,
    trolleyV: 0,
    targetX: cfg.box.chuteX,
    angle: 0,
    angVel: 0,
    cable: cfg.claw.restCable,
    held: null,
    slipAtCable: null,
    releaseStartMs: 0,
    items: chosen.map((kind, slot) => ({ id: slot + 1, kind, slot, fallStartMs: -1e9, fallFromY: 0 })),
    refills: [],
    nextChurnMs: cfg.churnMs,
    score: 0,
    strikes: 0,
    outcomes: [],
    over: false,
    endReason: null,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Where the claw's grip is: the end of the cable, swinging below the trolley. */
export function clawPos(state: ClawState, cfg: ClawConfig = CLAW_CONFIG): { x: number; y: number } {
  return { x: state.trolleyX + state.cable * Math.sin(state.angle), y: cfg.box.railY + state.cable * Math.cos(state.angle) };
}

/**
 * Pure real-time game state machine. You hold to steer (AIM) and let go to drop (DROP); TICK does the rest, with
 * physics: the trolley speeds up and brakes, the claw swings on its cable, and when it reaches the items it grabs the
 * one nearest where the swing put it (an off-centre grab may slip on the way up). Then it carries its catch to the
 * chute and restores it.
 * Good items score, bad ones may be strikes, and emptied slots refill. The round ends when time runs out or after
 * the last strike.
 */
export function createClawReducer(cfg: ClawConfig, kinds: readonly ItemKind[] = ITEMS) {
  const { box, claw } = cfg;

  /**
   * A kind for a new item: by the level's weights, except that it's always a good one while the machine has fewer
   * than cfg.minGood good items (not counting `leaving`, the item it replaces).
   */
  function freshKind(items: readonly Item[], leaving: Item | null, r1: number, r2: number, level: 1 | 2): number {
    const good = items.filter((i) => i !== leaving && kinds[i.kind].good).length;
    if (good >= cfg.minGood) return pickKind(r1, level, kinds);
    const goodKinds = kinds.filter((k) => k.good);
    return kinds.indexOf(goodKinds[pickKind(r2, level, goodKinds)]);
  }

  /** The claw reaches the items: catch the one nearest where it came down, if any is in range. */
  function grab(state: ClawState): ClawState {
    const x = clawPos(state, cfg).x;
    let best: Item | null = null;
    for (const item of state.items) {
      const d = Math.abs(slotX(item.slot, cfg) - x);
      if (d <= claw.grabRange && (!best || d < Math.abs(slotX(best.slot, cfg) - x))) best = item;
    }
    if (!best) return { ...state, phase: 'up' };
    const offset = Math.abs(slotX(best.slot, cfg) - x);
    let { seed } = state;
    let slipAtCable: number | null = null;
    if (offset > claw.firmGrip) {
      const chance = (claw.maxSlipChance * (offset - claw.firmGrip)) / (claw.grabRange - claw.firmGrip);
      let r: number;
      [r, seed] = nextRandom(seed);
      if (r < chance) {
        [r, seed] = nextRandom(seed);
        slipAtCable = claw.restCable + (state.cable - claw.restCable) * (0.2 + r * 0.5);
      }
    }
    return { ...state, seed, phase: 'up', held: best.id, slipAtCable };
  }

  /**
   * The crane's physics for a small step (dt in seconds): the trolley heads for its target (yours while you steer,
   * the chute while carrying; otherwise it brakes), and the claw swings as a damped pendulum under the moving trolley.
   */
  function physics(state: ClawState, dt: number): ClawState {
    const steerTo = state.phase === 'aim' ? state.targetX : state.phase === 'carry' ? box.chuteX : null;
    const top = state.phase === 'carry' ? claw.carrySpeed : claw.maxSpeed;
    const wanted = steerTo === null ? 0 : clamp((steerTo - state.trolleyX) * claw.followGain, -top, top);
    const a = clamp((wanted - state.trolleyV) / dt, -claw.accel, claw.accel);
    let trolleyV = state.trolleyV + a * dt;
    let trolleyX = state.trolleyX + trolleyV * dt;
    const clamped = clampX(trolleyX, cfg);
    if (clamped !== trolleyX) {
      trolleyX = clamped;
      trolleyV = 0;
    }
    const L = state.cable;
    const angAcc = -(claw.gravity / L) * Math.sin(state.angle) - (a / L) * Math.cos(state.angle) - claw.damping * state.angVel;
    const angVel = state.angVel + angAcc * dt;
    return { ...state, trolleyX, trolleyV, angVel, angle: state.angle + angVel * dt };
  }

  /** The claw lets go over the chute: the item is restored, and its slot refills later. */
  function restore(state: ClawState): ClawState {
    const item = state.items.find((i) => i.id === state.held);
    const next: ClawState = { ...state, phase: 'idle', held: null, targetX: state.trolleyX };
    if (!item) return next;
    const kind = kinds[item.kind];
    const type: Outcome['type'] = kind.good ? 'good' : kind.strike ? 'strike' : 'dud';
    const strikes = state.strikes + (type === 'strike' ? 1 : 0);
    return {
      ...next,
      items: state.items.filter((i) => i !== item),
      refills: [...state.refills, { slot: item.slot, atMs: state.timeMs + cfg.refillMs }],
      score: state.score + (kind.good ? kind.points : 0),
      strikes,
      outcomes: [...state.outcomes, { kind: item.kind, type, points: kind.good ? kind.points : 0, atMs: state.timeMs }],
      over: strikes >= cfg.maxStrikes,
      endReason: strikes >= cfg.maxStrikes ? 'strikes' : null,
    };
  }

  /** One small step of the crane (dt in seconds): physics, then what the phase does. */
  function crane(state: ClawState, dt: number): ClawState {
    let s = physics(state, dt);
    switch (s.phase) {
      case 'down': {
        s = { ...s, cable: s.cable + claw.dropSpeed * dt };
        // Down at the items (or as far as the cable goes): grab.
        if (clawPos(s, cfg).y >= box.itemY || s.cable >= (box.itemY - box.railY) * 1.3) s = grab(s);
        break;
      }
      case 'up': {
        s = { ...s, cable: Math.max(claw.restCable, s.cable - claw.liftSpeed * dt) };
        // An off-centre grab slips on the way up: the item falls back to its slot.
        if (s.held !== null && s.slipAtCable !== null && s.cable <= s.slipAtCable) {
          const held = s.held;
          s = {
            ...s,
            held: null,
            slipAtCable: null,
            items: s.items.map((i) => (i.id === held ? { ...i, fallStartMs: s.timeMs, fallFromY: clawPos(s, cfg).y } : i)),
            outcomes: [...s.outcomes, { kind: s.items.find((i) => i.id === held)!.kind, type: 'slip', points: 0, atMs: s.timeMs }],
          };
        }
        if (s.cable <= claw.restCable) s = { ...s, phase: s.held !== null ? 'carry' : 'idle', targetX: s.trolleyX };
        break;
      }
      case 'carry':
        if (Math.abs(s.trolleyX - box.chuteX) < 2 && Math.abs(s.trolleyV) < 20) s = { ...s, phase: 'release', releaseStartMs: s.timeMs };
        break;
      case 'release':
        if (s.timeMs - s.releaseStartMs >= claw.releaseMs) s = restore(s);
        break;
    }
    return s;
  }

  function tick(state: ClawState, ms: number): ClawState {
    const dt = Math.min(Math.max(0, ms), cfg.maxTickMs);
    const timeMs = state.timeMs + dt;
    let s: ClawState = { ...state, timeMs, timeLeftMs: Math.max(0, state.timeLeftMs - dt) };

    const level = timeMs >= cfg.levelUpMs ? 2 : 1;
    // Refill emptied slots whose time has come.
    const due = s.refills.filter((r) => r.atMs <= timeMs);
    if (due.length > 0) {
      let { seed, nextId } = s;
      const items = [...s.items];
      for (const refill of due) {
        let r1: number, r2: number;
        [r1, seed] = nextRandom(seed);
        [r2, seed] = nextRandom(seed);
        const kind = freshKind(items, null, r1, r2, level);
        items.push({ id: nextId++, kind, slot: refill.slot, fallStartMs: timeMs, fallFromY: -box.itemSize });
      }
      s = { ...s, seed, nextId, items, refills: s.refills.filter((r) => r.atMs > timeMs) };
    }

    // The machine keeps changing: swap the longest-standing item for a fresh one, never the one under the claw.
    if (timeMs >= s.nextChurnMs) {
      const candidates = s.items.filter(
        (i) => i.id !== s.held && Math.abs(slotX(i.slot, cfg) - clawPos(s, cfg).x) > claw.grabRange,
      );
      const oldest = candidates.reduce<Item | null>((a, i) => (!a || i.fallStartMs < a.fallStartMs ? i : a), null);
      s = { ...s, nextChurnMs: s.nextChurnMs + cfg.churnMs };
      if (oldest) {
        let { seed } = s;
        let r1: number, r2: number;
        [r1, seed] = nextRandom(seed);
        [r2, seed] = nextRandom(seed);
        const fresh: Item = {
          id: s.nextId,
          kind: freshKind(s.items, oldest, r1, r2, level),
          slot: oldest.slot,
          fallStartMs: timeMs,
          fallFromY: -box.itemSize,
        };
        s = { ...s, seed, nextId: s.nextId + 1, items: s.items.map((i) => (i === oldest ? fresh : i)) };
      }
    }

    // The crane moves in steps of at most 5ms, so the swing stays smooth and stable. None at all for a 0ms frame
    // (they happen), since the physics divides by the step.
    const steps = Math.ceil(dt / 5);
    for (let i = 0; i < steps && !s.over; i++) s = crane(s, dt / steps / 1000);

    if (!s.over && s.timeLeftMs <= 0) s = { ...s, over: true, endReason: 'time' };
    return s;
  }

  return function clawReducer(state: ClawState, action: ClawAction): ClawState {
    if (state.over) return state;
    switch (action.type) {
      case 'TICK':
        return tick(state, action.ms);
      case 'AIM':
        return state.phase === 'idle' || state.phase === 'aim'
          ? { ...state, phase: 'aim', targetX: clampX(action.x, cfg) }
          : state;
      case 'DROP':
        return state.phase === 'idle' || state.phase === 'aim' ? { ...state, phase: 'down' } : state;
    }
  };
}

export const clawReducer = createClawReducer(CLAW_CONFIG);

export interface MistakeLesson {
  kind: ItemKind;
  count: number;
}

/** The bad things restored this round, one entry per kind, in the order first restored. */
export function mistakeLessons(outcomes: readonly Outcome[], kinds: readonly ItemKind[] = ITEMS): MistakeLesson[] {
  const byKind = new Map<number, MistakeLesson>();
  for (const o of outcomes) {
    if (o.type !== 'strike' && o.type !== 'dud') continue;
    const seen = byKind.get(o.kind);
    if (seen) seen.count++;
    else byKind.set(o.kind, { kind: kinds[o.kind], count: 1 });
  }
  return [...byKind.values()];
}
