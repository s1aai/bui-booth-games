import { seededSource } from '../../shell/rng';
import { BYTE_GUARD_CONFIG as cfg } from './config';
import { GOOD_KINDS, KINDS, POWER_KINDS, itemSize, threatPool, type ItemKind, type Tone } from './data';

/** play: falling; pause: frozen by the player; over: the server is down. */
export type Mode = 'play' | 'pause' | 'over';

export interface Item {
  id: number;
  kind: ItemKind;
  x: number;
  y: number;
  vy: number;
  /** Phase of the sideways wobble. */
  wob: number;
}

export interface Bolt {
  x: number;
  y: number;
}

export interface Float {
  id: number;
  x: number;
  y: number;
  text: string;
  tone: Tone;
  /** Seconds on screen. */
  age: number;
}

export interface Stats {
  /** Threats zapped, and of those, phishing. */
  zapped: number;
  phishZapped: number;
  /** Good files caught. */
  delivered: number;
  /** Good files zapped by mistake. */
  friendsZapped: number;
  /** Threats that got past (a strike each), including ones caught by mistake. */
  letIn: number;
  bestCombo: number;
}

/** What the player is holding this tick. */
export interface Controls {
  /** -1 left, 0 still, 1 right, from the keyboard or the on-screen buttons. */
  steer: -1 | 0 | 1;
  /** Where a pointer is dragging, in game units, or null. */
  pointerX: number | null;
  /** Holding the zap button. */
  fire: boolean;
}

export interface ByteGuardState {
  mode: Mode;
  /** The world's width in game units, set from the screen's shape when the run starts. */
  width: number;
  /** The random source's position: the same seed and inputs replay the same run. */
  seed: number;
  nextId: number;
  score: number;
  lives: number;
  /** Seconds of play so far. The game speeds up with it (rampOf). */
  time: number;
  playerX: number;
  fireCooldown: number;
  /** Seconds until the next item falls. */
  spawnIn: number;
  /** Seconds of slow-mo left from an UPDATE. */
  slowLeft: number;
  shield: boolean;
  flashLeft: number;
  serverHitLeft: number;
  streak: number;
  items: Item[];
  bolts: Bolt[];
  floats: Float[];
  stats: Stats;
  /** Every mistake the run made, one kind each, for the lessons page. */
  mistakes: ItemKind[];
}

export type Action =
  /** A new run on a world this wide: sent once, when the screen has been measured. */
  | { type: 'start'; width: number }
  | { type: 'tick'; ms: number; controls: Controls }
  | { type: 'pause' }
  | { type: 'resume' };

/** The world's width for a stage this big (any units): the stage's shape at the world's height, within limits. */
export function worldWidth(stageWidth: number, stageHeight: number): number {
  return Math.round(clamp((stageWidth * cfg.height) / stageHeight, cfg.minWidth, cfg.maxWidth));
}

export function createRun(seed: number, width: number = cfg.width): ByteGuardState {
  return {
    mode: 'play',
    width,
    seed,
    nextId: 1,
    score: 0,
    lives: cfg.lives,
    time: 0,
    playerX: width / 2,
    fireCooldown: 0,
    spawnIn: 0.6,
    slowLeft: 0,
    shield: false,
    flashLeft: 0,
    serverHitLeft: 0,
    streak: 0,
    items: [],
    bolts: [],
    floats: [],
    stats: { zapped: 0, phishZapped: 0, delivered: 0, friendsZapped: 0, letIn: 0, bestCombo: 1 },
    mistakes: [],
  };
}

export function byteGuardReducer(state: ByteGuardState, action: Action): ByteGuardState {
  switch (action.type) {
    case 'start':
      return createRun(state.seed, action.width);
    case 'tick':
      return advance(state, action.ms, action.controls);
    case 'pause':
      return state.mode === 'play' ? { ...state, mode: 'pause' } : state;
    case 'resume':
      return state.mode === 'pause' ? { ...state, mode: 'play' } : state;
  }
}

/** The score multiplier for a streak: one more step for each streakPerCombo, up to maxCombo. */
export function comboOf(streak: number): number {
  return Math.min(cfg.maxCombo, 1 + Math.floor(streak / cfg.streakPerCombo));
}

/** How many times faster than at the start the game is after `time` seconds: twice every rampSeconds, no cap. */
export function rampOf(time: number): number {
  return 2 ** (time / cfg.rampSeconds);
}

/** Seconds as m:ss, for the time shown in the header and on the board. */
export function clock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The lessons page's list: each kind of mistake once, with how often it happened, in the order it first did. */
export function mistakeCounts(mistakes: readonly ItemKind[]): { kind: ItemKind; count: number }[] {
  const counts = new Map<ItemKind, number>();
  for (const kind of mistakes) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  return [...counts].map(([kind, count]) => ({ kind, count }));
}

/** Moves the game on by `ms` of real time. Returns the same state when nothing can change (paused or over). */
export function advance(state: ByteGuardState, ms: number, controls: Controls): ByteGuardState {
  if (state.mode !== 'play') return state;
  const dt = Math.min(ms, cfg.maxTickMs) / 1000;
  const rng = seededSource(state.seed);
  const s: ByteGuardState = {
    ...state,
    items: state.items.map((item) => ({ ...item })),
    bolts: state.bolts.map((bolt) => ({ ...bolt })),
    floats: state.floats.map((float) => ({ ...float })),
    stats: { ...state.stats },
    mistakes: [...state.mistakes],
  };
  const slow = s.slowLeft > 0 ? cfg.slowFactor : 1;
  s.slowLeft = Math.max(0, s.slowLeft - dt);
  s.flashLeft = Math.max(0, s.flashLeft - dt);
  s.serverHitLeft = Math.max(0, s.serverHitLeft - dt);
  s.time += dt;
  for (const float of s.floats) float.age += dt;
  s.floats = s.floats.filter((float) => float.age < cfg.floatSeconds);

  movePlayer(s, dt, controls);
  s.fireCooldown -= dt;
  if (controls.fire && s.fireCooldown <= 0 && s.bolts.length < cfg.maxBolts) {
    s.bolts.push({ x: s.playerX, y: cfg.playerY - 18 });
    s.fireCooldown = cfg.fireCooldown;
  }

  s.spawnIn -= dt * slow;
  if (s.spawnIn <= 0) {
    spawn(s, rng);
    s.spawnIn = ((cfg.spawnBase / rampOf(s.time)) * (0.8 + rng.next() * 0.4)) / forWidth(s, cfg.spawnPerWidth);
  }

  for (const bolt of s.bolts) bolt.y -= cfg.boltSpeed * dt;

  // An item is gone once it's zapped, caught, or has reached the server. Gone ids are collected, then removed.
  const gone = new Set<number>();
  for (const item of s.items) {
    if (s.mode !== 'play') break;
    item.y += item.vy * dt * slow;
    item.wob += dt * 3;
    item.x = clamp(item.x + Math.sin(item.wob) * wobbleOf(item.kind) * dt, 18, s.width - 18);

    const { w, h } = itemSize(item.kind);
    const bolt = s.bolts.find(
      (b) => Math.abs(b.x - item.x) < w / 2 + cfg.boltReachX && Math.abs(b.y - item.y) < h / 2 + cfg.boltReachY,
    );
    if (bolt) {
      bolt.y = -999;
      gone.add(item.id);
      zapItem(s, item);
      continue;
    }
    const inLine =
      item.y + h / 2 >= cfg.playerY - cfg.catchAbove && item.y - h / 2 <= cfg.playerY + cfg.catchBelow;
    const inReach = Math.abs(item.x - s.playerX) < cfg.playerWidth / 2 + w / 2 - cfg.catchInset;
    if (inLine && inReach) {
      gone.add(item.id);
      catchItem(s, item);
      continue;
    }
    if (item.y - h / 2 > cfg.groundY) {
      gone.add(item.id);
      reachServer(s, item);
    }
  }
  s.items = s.items.filter((item) => !gone.has(item.id));
  s.bolts = s.bolts.filter((bolt) => bolt.y > -20);
  return { ...s, seed: rng.seed };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** A rate tuned on the config's width, for this world: 1 + (width / cfg.width - 1) × `per`. */
function forWidth(s: ByteGuardState, per: number): number {
  return 1 + (s.width / cfg.width - 1) * per;
}

function pick<T>(list: readonly T[], rng: { next(): number }): T {
  return list[Math.floor(rng.next() * list.length)];
}

function wobbleOf(kind: ItemKind): number {
  if (kind === 'thief') return cfg.wobbleThief;
  return KINDS[kind].good ? cfg.wobbleGood : cfg.wobbleThreat;
}

function movePlayer(s: ByteGuardState, dt: number, controls: Controls): void {
  const speed = cfg.playerSpeed * forWidth(s, cfg.speedPerWidth);
  if (controls.pointerX !== null) {
    const distance = controls.pointerX - s.playerX;
    s.playerX += Math.sign(distance) * Math.min(Math.abs(distance), speed * cfg.dragSpeedFactor * dt);
  }
  s.playerX += controls.steer * speed * dt;
  s.playerX = clamp(s.playerX, cfg.playerWidth / 2, s.width - cfg.playerWidth / 2);
}

function spawn(s: ByteGuardState, rng: { next(): number }): void {
  const roll = rng.next();
  const goodLimit = cfg.powerChance + Math.max(cfg.goodChanceMin, cfg.goodChance - s.time * cfg.goodChancePerSecond);
  let kind: ItemKind;
  if (roll < cfg.powerChance) kind = pick(POWER_KINDS, rng);
  else if (roll < goodLimit) kind = pick(GOOD_KINDS, rng);
  else kind = pick(threatPool(s.time), rng);
  s.items.push({
    id: s.nextId++,
    kind,
    x: 30 + rng.next() * (s.width - 60),
    y: -20,
    vy: cfg.fallBase * rampOf(s.time) + rng.next() * cfg.fallRandom,
    wob: rng.next() * 6.28,
  });
}

function floatAt(s: ByteGuardState, x: number, y: number, text: string, tone: Tone): void {
  s.floats.push({ id: s.nextId++, x, y, text, tone, age: 0 });
}

function noteCombo(s: ByteGuardState): void {
  s.stats.bestCombo = Math.max(s.stats.bestCombo, comboOf(s.streak));
}

function zapItem(s: ByteGuardState, item: Item): void {
  const info = KINDS[item.kind];
  if (info.power) {
    floatAt(s, item.x, item.y, 'Catch those!', 'pale');
    return;
  }
  if (info.good) {
    s.streak = 0;
    s.stats.friendsZapped++;
    s.mistakes.push(item.kind);
    floatAt(s, item.x, item.y, 'Oops! That was a friend', 'gold');
    return;
  }
  s.streak++;
  const points = info.points * comboOf(s.streak);
  s.score += points;
  s.stats.zapped++;
  if (item.kind === 'phish') s.stats.phishZapped++;
  noteCombo(s);
  floatAt(s, item.x, item.y, `+${points}`, 'magenta');
}

function catchItem(s: ByteGuardState, item: Item): void {
  const info = KINDS[item.kind];
  if (info.power) {
    applyPower(s, item);
    return;
  }
  if (info.good) {
    s.streak++;
    const points = info.points * comboOf(s.streak);
    s.score += points;
    s.stats.delivered++;
    noteCombo(s);
    floatAt(s, item.x, item.y - 10, `+${points}`, 'gold');
    return;
  }
  strike(s, item.kind, "Don't open strange stuff!", item.x);
}

function reachServer(s: ByteGuardState, item: Item): void {
  const info = KINDS[item.kind];
  if (info.power) return;
  if (info.good) {
    s.streak = 0;
    floatAt(s, item.x, cfg.groundY - 14, 'Missed!', 'pale');
    return;
  }
  strike(s, item.kind, info.oops ?? 'A threat got in!', item.x);
}

function applyPower(s: ByteGuardState, item: Item): void {
  if (item.kind === 'patch') s.slowLeft = cfg.slowSeconds;
  if (item.kind === 'mfa') s.shield = true;
  if (item.kind === 'backup') s.lives = Math.min(cfg.maxLives, s.lives + 1);
  floatAt(s, item.x, item.y - 10, KINDS[item.kind].info ?? '', 'green');
}

/** A threat got through (or was caught by mistake). The shield blocks the first one. */
function strike(s: ByteGuardState, kind: ItemKind, message: string, x: number): void {
  if (s.shield) {
    s.shield = false;
    floatAt(s, x, cfg.playerY - 40, 'MFA BLOCKED IT!', 'cyan');
    return;
  }
  s.lives--;
  s.streak = 0;
  s.flashLeft = cfg.flashSeconds;
  s.serverHitLeft = cfg.serverHitSeconds;
  s.stats.letIn++;
  s.mistakes.push(kind);
  floatAt(s, clamp(x, 90, s.width - 90), cfg.playerY - 50, message, 'red');
  if (s.lives <= 0) {
    s.mode = 'over';
    s.flashLeft = 0; // Ticks stop at Game Over, so the red flash would never fade and would cover the board.
  }
}
