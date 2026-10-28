import { seededSource } from '../../shell/rng';
import { PYTHON_PW_CONFIG as cfg } from './config';
import { LESSONS, TYPES, TYPE_ORDER, WEAK, type CharType } from './data';
import { GOALS, crackLog, goalFor } from './strength';

/** ready: the get-ready count; play: moving; pause: frozen; over: cracked. */
export type Mode = 'ready' | 'play' | 'pause' | 'over';
export type DirName = 'up' | 'down' | 'left' | 'right';
export type PowerKind = 'mfa' | 'vault' | 'backup';
/** What the lessons page can teach: a weak word was eaten, or a bot got in. */
export type Mistake = 'weak' | 'bot';
/** How a score text is coloured: a danger red, a gold, a shield cyan, a power green, plain, or a character's colour. */
export type Tone = 'danger' | 'gold' | 'shield' | 'power' | 'plain' | CharType;

export interface Pos {
  x: number;
  y: number;
}
export interface Dir {
  x: number;
  y: number;
}
export interface Char {
  ch: string;
  type: CharType;
}
export interface Tile extends Pos, Char {
  /** Phase of the bob. */
  ph: number;
}
export interface Weak extends Pos {
  word: string;
  ttl: number;
}
export interface Power extends Pos {
  kind: PowerKind;
  ttl: number;
}
export interface Bot extends Pos {
  dir: Dir;
  /** The cell the bot was in before its last step, for the glide. */
  prev: Pos;
  /** Moves banked up, and seconds stunned. */
  acc: number;
  stun: number;
  id: number;
  /** Cells a second at the start of the run. Twice as fast every botDoubleSeconds. */
  speed: number;
  chaser: boolean;
}
export interface Float {
  x: number;
  y: number;
  text: string;
  tone: Tone;
  /** Seconds on screen. */
  age: number;
}
export interface Stats {
  eaten: number;
  dodged: number;
  botsBlocked: number;
  bestLog: number;
  bestPw: Char[];
}

/** A board's size in cells. */
export interface Board {
  cols: number;
  rows: number;
}

export interface PyState extends Board {
  mode: Mode;
  /** Where a pause came from, so Resume goes back to it. */
  pausedFrom: 'ready' | 'play';
  /** The random source's position: the same seed and inputs replay the same run. */
  seed: number;
  nextId: number;
  readyT: number;
  score: number;
  lives: number;
  /** Seconds of play so far (not counting get-ready or pauses). Everything speeds up with it. */
  time: number;
  /** Crack-time goals the password has reached this run: the next one is goalFor(goals + 1). */
  goals: number;
  /** Snake head first. The password is chars, one per segment after the head. */
  snake: Pos[];
  /** The snake's cells before its last step, so the picture can glide from them to the new cells. */
  prevSnake: Pos[];
  chars: Char[];
  dir: Dir;
  queue: Dir[];
  moveAcc: number;
  tiles: Tile[];
  weak: Weak[];
  powers: Power[];
  bots: Bot[];
  shieldT: number;
  invulnT: number;
  weakT: number;
  powerT: number;
  floats: Float[];
  stats: Stats;
  /** Every mistake the run made, for the lessons page. */
  mistakes: Mistake[];
}

export type Action =
  /** A new run on a board this size: sent once, when the screen has been measured. */
  | { type: 'start'; board: Board }
  | { type: 'tick'; ms: number }
  | { type: 'turn'; dir: DirName }
  | { type: 'pause' }
  | { type: 'resume' };

export const DIRS: Record<DirName, Dir> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

type Rng = ReturnType<typeof seededSource>;

/** Pixel position of a board cell's centre, in game units. */
export const cx = (x: number) => x * cfg.cell + cfg.cell / 2;
export const cy = (y: number) => y * cfg.cell + cfg.cell / 2;

/** How much the HUD is scaled up on a screen this wide: only the one-row HUD grows, and only past hudScaleFromPx. */
export function hudScale(width: number): number {
  return width >= cfg.hudWideFromPx ? Math.max(1, width / cfg.hudScaleFromPx) : 1;
}

/** The HUD band's height, in screen pixels, on a screen this wide. */
export function hudHeight(width: number): number {
  return width >= cfg.hudWideFromPx ? Math.round(cfg.hudPx * hudScale(width)) : cfg.hudNarrowPx;
}

/** The board for a stage this big (in screen pixels): about targetRows rows, and as many columns as fit. */
export function boardFor(width: number, height: number): Board {
  const room = height - hudHeight(width);
  const fit = Math.min(cfg.maxCellPx, Math.max(cfg.minCellPx, Math.floor(room / cfg.targetRows)));
  const cell = Math.max(1, Math.min(fit, Math.floor(width / cfg.minCols)));
  return {
    cols: Math.min(cfg.maxCols, Math.max(cfg.minCols, Math.floor(width / cell))),
    rows: Math.max(cfg.minRows, Math.floor(room / cell)),
  };
}

/** How much busier this board is than the one the counts were tuned on. Never less busy. */
function busy(s: PyState): number {
  const area = (s.cols * s.rows) / (cfg.cols * cfg.rows);
  return Math.max(1, 1 + (area - 1) * cfg.busyPerArea);
}

/** A count tuned on the config's board, scaled to this one. */
const scaled = (s: PyState, n: number) => Math.round(n * busy(s));

function blank(seed: number, board: Board): PyState {
  return {
    ...board,
    mode: 'ready',
    pausedFrom: 'ready',
    seed,
    nextId: 1,
    readyT: cfg.readySeconds,
    score: 0,
    lives: cfg.lives,
    time: 0,
    goals: 0,
    snake: [],
    prevSnake: [],
    chars: [],
    dir: DIRS.up,
    queue: [],
    moveAcc: 0,
    tiles: [],
    weak: [],
    powers: [],
    bots: [],
    shieldT: 0,
    invulnT: 0,
    weakT: 5,
    powerT: 12,
    floats: [],
    stats: { eaten: 0, dodged: 0, botsBlocked: 0, bestLog: -Infinity, bestPw: [] },
    mistakes: [],
  };
}

/** A new run, ready to start, on a board sized to the screen or the config's board. */
export function createRun(seed: number, board: Board = { cols: cfg.cols, rows: cfg.rows }): PyState {
  return edit(blank(seed, board), (s, rng) => setupRun(s, rng));
}

/**
 * Runs `fn` on a copy of the state, so the reducer never changes the state it was given. The copy's arrays and
 * the objects in them are new, so `fn` may push, splice and assign freely.
 */
function edit(state: PyState, fn: (s: PyState, rng: Rng) => void): PyState {
  const rng = seededSource(state.seed);
  const s: PyState = {
    ...state,
    snake: state.snake.map((p) => ({ ...p })),
    prevSnake: state.prevSnake.map((p) => ({ ...p })),
    chars: state.chars.map((c) => ({ ...c })),
    queue: [...state.queue],
    tiles: state.tiles.map((t) => ({ ...t })),
    weak: state.weak.map((w) => ({ ...w })),
    powers: state.powers.map((p) => ({ ...p })),
    bots: state.bots.map((b) => ({ ...b })),
    floats: state.floats.map((f) => ({ ...f })),
    stats: { ...state.stats },
    mistakes: [...state.mistakes],
  };
  fn(s, rng);
  s.seed = rng.seed;
  return s;
}

export function pyReducer(state: PyState, action: Action): PyState {
  switch (action.type) {
    case 'start':
      return createRun(state.seed, action.board);
    case 'tick': {
      if (state.mode !== 'ready' && state.mode !== 'play') return state;
      const dt = Math.min(action.ms, cfg.maxTickMs) / 1000;
      return edit(state, (s, rng) => update(s, rng, dt));
    }
    case 'turn':
      return turn(state, action.dir);
    case 'pause':
      if (state.mode !== 'ready' && state.mode !== 'play') return state;
      return { ...state, pausedFrom: state.mode, mode: 'pause' };
    case 'resume':
      return state.mode === 'pause' ? { ...state, mode: state.pausedFrom } : state;
  }
}

/** Queues a turn. Turning straight back into your own body is refused, and so is a queue of three. */
function turn(state: PyState, name: DirName): PyState {
  if (state.mode !== 'ready' && state.mode !== 'play') return state;
  const d = DIRS[name];
  const last = state.queue.length ? state.queue[state.queue.length - 1] : state.dir;
  if (sameDir(d, last)) return state;
  if (state.chars.length > 0 && d.x === -last.x && d.y === -last.y) return state;
  if (state.queue.length >= 3) return state;
  return { ...state, queue: [...state.queue, d] };
}

function sameDir(a: Dir, b: Dir): boolean {
  return a.x === b.x && a.y === b.y;
}

function rnd(rng: Rng, n: number): number {
  return Math.floor(rng.next() * n);
}

function pick<T>(list: readonly T[], rng: Rng): T {
  return list[rnd(rng, list.length)];
}

function shuffled<T>(list: readonly T[], rng: Rng): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The snake's speed, in cells a second, `time` seconds into a run: twice as fast every speedDoubleSeconds. */
export function speedOf(time: number): number {
  return cfg.startSpeed * 2 ** (time / cfg.speedDoubleSeconds);
}

/** How many times faster bots move, and weak words turn up, `time` seconds into a run. */
function threatRamp(time: number): number {
  return 2 ** (time / cfg.botDoubleSeconds);
}

/** How many bots should be on the board: one more every botEverySeconds, up to maxBots (both scaled to the board). */
function botsWanted(s: PyState): number {
  return Math.min(scaled(s, cfg.maxBots), scaled(s, 1 + Math.floor(s.time / cfg.botEverySeconds)));
}

function resetSnake(s: PyState): void {
  s.snake = [{ x: Math.floor(s.cols / 2), y: s.rows - 5 }];
  s.prevSnake = s.snake.map((p) => ({ ...p }));
  s.chars = [];
  s.dir = DIRS.up;
  s.queue = [];
  s.moveAcc = 0;
}

/** The board at the start of a run: the snake, the first bots and the first characters. */
function setupRun(s: PyState, rng: Rng): void {
  resetSnake(s);
  s.weakT = cfg.weakFirstSeconds + rng.next() * 2;
  s.powerT = cfg.powerFirstSeconds + rng.next() * 5;
  const nBots = botsWanted(s);
  // The bots start in two rows across the top part of the board, spread from one side to the other: the top row
  // heads inwards, the second row down.
  const perRow = Math.max(2, Math.ceil(nBots / 2));
  const rowY = [1, Math.round(s.rows * 0.37)];
  for (let i = 0; i < nBots; i++) {
    const row = Math.floor(i / perRow);
    const j = i % perRow;
    const spot = { x: 1 + Math.round((j * (s.cols - 3)) / (perRow - 1)), y: rowY[row] };
    s.bots.push({
      ...spot,
      prev: { ...spot },
      dir: row === 0 ? (j < perRow / 2 ? DIRS.right : DIRS.left) : DIRS.down,
      acc: 0,
      stun: 0,
      id: i,
      speed: cfg.botSpeed + i * cfg.botSpeedPerBot,
      chaser: false,
    });
  }
  for (let i = 0; i < scaled(s, 5); i++) spawnChar(s, rng);
}

/** A bot joining a run under way: it starts stunned, in the corner farthest from the head. */
function addBot(s: PyState): void {
  const id = s.bots.length;
  const b: Bot = {
    x: 0,
    y: 0,
    prev: { x: 0, y: 0 },
    dir: DIRS.down,
    acc: 0,
    stun: 0,
    id,
    speed: cfg.botSpeed + id * cfg.botSpeedPerBot,
    chaser: false,
  };
  respawnBot(s, b);
  s.bots.push(b);
}

/** Moves the game on by one clock step. Runs inside `edit`, so it can change `s` directly. */
function update(s: PyState, rng: Rng, dt: number): void {
  for (const f of s.floats) f.age += dt;
  s.floats = s.floats.filter((f) => f.age < cfg.floatSeconds);

  if (s.mode === 'ready') {
    s.readyT -= dt;
    if (s.readyT <= 0) s.mode = 'play';
    return;
  }
  s.time += dt;
  s.shieldT = Math.max(0, s.shieldT - dt);
  s.invulnT = Math.max(0, s.invulnT - dt);

  s.moveAcc += dt * speedOf(s.time);
  while (s.moveAcc >= 1 && s.mode === 'play') {
    s.moveAcc -= 1;
    step(s, rng);
  }
  if (s.mode !== 'play') return;

  while (s.bots.length < botsWanted(s)) addBot(s);
  if (s.time >= cfg.chaserFromSeconds) s.bots[0].chaser = true;
  const ramp = threatRamp(s.time);
  for (const b of s.bots) {
    if (b.stun > 0) {
      b.stun -= dt;
      continue;
    }
    b.acc += dt * b.speed * ramp;
    while (b.acc >= 1 && b.stun <= 0) {
      b.acc -= 1;
      moveBot(s, rng, b);
      // After every step, not once a tick: a bot faster than a cell a tick would otherwise step through the head.
      checkBots(s);
      if (s.mode !== 'play') return;
    }
    if (b.stun > 0) b.acc = 0;
  }
  checkBots(s);
  if (s.mode !== 'play') return;

  s.weakT -= dt;
  if (s.weakT <= 0) {
    s.weakT = cfg.weakEverySeconds / ramp + rng.next() * 2;
    if (s.weak.length < scaled(s, 1 + Math.floor(s.time / cfg.weakMoreSeconds))) {
      const c = freeCell(s, rng, 3);
      if (c) s.weak.push({ ...c, word: pick(WEAK, rng), ttl: cfg.weakTtl });
    }
  }
  for (const w of s.weak) w.ttl -= dt;
  const before = s.weak.length;
  s.weak = s.weak.filter((w) => w.ttl > 0);
  s.stats.dodged += before - s.weak.length;

  s.powerT -= dt;
  if (s.powerT <= 0) {
    s.powerT = cfg.powerEverySeconds + rng.next() * 6;
    const c = freeCell(s, rng, 3);
    if (c) {
      const kinds: PowerKind[] = ['mfa', 'vault', 'mfa', 'vault'];
      if (s.lives < cfg.lives) kinds.push('backup', 'backup');
      s.powers.push({ ...c, kind: pick(kinds, rng), ttl: cfg.powerTtl });
    }
  }
  for (const p of s.powers) p.ttl -= dt;
  s.powers = s.powers.filter((p) => p.ttl > 0);
  while (s.tiles.length < scaled(s, 3)) spawnChar(s, rng);
}

/** Moves the snake one cell. Eating, weak words, power-ups and bots are all checked here. */
function step(s: PyState, rng: Rng): void {
  if (s.queue.length) s.dir = s.queue.shift()!;
  const h = s.snake[0];
  const nx = h.x + s.dir.x;
  const ny = h.y + s.dir.y;
  if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) return loseLife(s, 'Bonk! You hit the firewall.');

  const tile = s.tiles.find((t) => t.x === nx && t.y === ny);
  // The tail moves away this step, unless the snake is growing onto a character.
  const body = s.snake.slice(1, tile ? s.snake.length : s.snake.length - 1);
  if (body.some((p) => p.x === nx && p.y === ny)) return loseLife(s, 'Ouch! You bit your own tail.');

  s.prevSnake = s.snake.map((p) => ({ ...p }));
  s.snake.unshift({ x: nx, y: ny });
  if (tile) {
    s.tiles = s.tiles.filter((t) => t !== tile);
    s.chars.push({ ch: tile.ch, type: tile.type });
    const kinds = new Set(s.chars.map((c) => c.type)).size;
    const pts = cfg.eatPoints * kinds;
    s.score += pts;
    s.stats.eaten++;
    floatAt(s, cx(nx), cy(ny) - 12, `+${pts}${kinds > 1 ? `  x${kinds}` : ''}`, tile.type);
    spawnChar(s, rng);
    updateBest(s);
    checkGoals(s);
  } else {
    s.snake.pop();
  }

  const w = s.weak.find((t) => t.x === nx && t.y === ny);
  if (w) {
    s.weak = s.weak.filter((t) => t !== w);
    message(s, 0.34, `"${w.word}" is the first thing hackers try!`, 'danger');
    s.lives--;
    s.mistakes.push('weak');
    if (s.lives <= 0) return gameOver(s);
    if (s.chars.length > 1) chopAt(s, Math.max(1, Math.floor(s.chars.length / 2)) + 1, 'Weak word! -N chars');
  }

  const pw = s.powers.find((t) => t.x === nx && t.y === ny);
  if (pw) {
    s.powers = s.powers.filter((t) => t !== pw);
    power(s, rng, pw);
  }
  checkBots(s);
}

function power(s: PyState, rng: Rng, p: Power): void {
  if (p.kind === 'mfa') {
    s.shieldT = cfg.shieldSeconds;
    floatAt(s, cx(p.x), cy(p.y) - 12, 'MFA SHIELD! Bots bounce off', 'shield');
  }
  if (p.kind === 'backup') {
    s.lives = Math.min(cfg.maxLives, s.lives + 1);
    floatAt(s, cx(p.x), cy(p.y) - 12, 'BACKUP! +1 heart', 'power');
  }
  if (p.kind === 'vault') {
    // Kinds the password doesn't have yet come first, then the rest in a random order.
    const have = new Set(s.chars.map((c) => c.type));
    const missing = TYPE_ORDER.filter((t) => !have.has(t));
    const order = [...missing, ...shuffled(TYPE_ORDER.filter((t) => !missing.includes(t)), rng)];
    const tail = s.snake[s.snake.length - 1];
    for (let i = 0; i < cfg.vaultChars; i++) {
      const type = order[i];
      const set = TYPES[type].chars;
      s.chars.push({ ch: set[rnd(rng, set.length)], type });
      s.snake.push({ ...tail });
    }
    s.score += cfg.vaultPoints;
    floatAt(s, cx(p.x), cy(p.y) - 12, `PASSWORD MANAGER! +${cfg.vaultChars} strong chars`, 'gold');
    updateBest(s);
    checkGoals(s);
  }
}

/** A bot steps once: it avoids turning back, and a chaser heads for the middle of the password. */
function moveBot(s: PyState, rng: Rng, b: Bot): void {
  b.prev = { x: b.x, y: b.y };
  const opts = Object.values(DIRS).filter((d) => {
    const x = b.x + d.x;
    const y = b.y + d.y;
    return x >= 0 && y >= 0 && x < s.cols && y < s.rows;
  });
  const noReverse = opts.filter((d) => !(d.x === -b.dir.x && d.y === -b.dir.y));
  const pool = noReverse.length ? noReverse : opts;
  let d: Dir;
  if (b.chaser && s.snake.length && rng.next() < cfg.chaseChance) {
    const target = s.snake[Math.min(s.snake.length - 1, Math.floor(s.snake.length / 2))];
    const distance = (c: Dir) => Math.abs(b.x + c.x - target.x) + Math.abs(b.y + c.y - target.y);
    d = pool.reduce((best, c) => (distance(c) < distance(best) ? c : best));
  } else {
    d = pool.some((c) => sameDir(c, b.dir)) && rng.next() < 0.75 ? b.dir : pick(pool, rng);
  }
  b.dir = d;
  b.x += d.x;
  b.y += d.y;
}

/** Puts a zapped bot back in the corner farthest from the head. */
function respawnBot(s: PyState, b: Bot): void {
  const h = s.snake[0];
  const corners: Pos[] = [
    { x: 0, y: 0 },
    { x: s.cols - 1, y: 0 },
    { x: 0, y: s.rows - 1 },
    { x: s.cols - 1, y: s.rows - 1 },
  ];
  const far = (c: Pos) => Math.abs(c.x - h.x) + Math.abs(c.y - h.y);
  const corner = corners.reduce((best, c) => (far(c) > far(best) ? c : best));
  Object.assign(b, corner, { prev: { ...corner }, stun: cfg.botRespawnSeconds });
}

/** Bots that have reached the snake: the shield zaps them, a bite on the head costs a life, the rest chop it. */
function checkBots(s: PyState): void {
  if (s.mode !== 'play') return;
  for (const b of s.bots) {
    const i = s.snake.findIndex((p) => p.x === b.x && p.y === b.y);
    if (i < 0 || b.stun > 0) continue;
    if (s.shieldT > 0) {
      s.score += cfg.botZapPoints;
      s.stats.botsBlocked++;
      floatAt(s, cx(b.x), cy(b.y) - 12, `BLOCKED! +${cfg.botZapPoints}`, 'shield');
      respawnBot(s, b);
      continue;
    }
    if (s.invulnT > 0) continue;
    s.mistakes.push('bot');
    if (i === 0) return loseLife(s, 'A guess-bot cracked your password!');
    chopAt(s, i, 'Bot guessed N chars!');
    b.stun = cfg.botBounceSeconds;
    b.dir = { x: -b.dir.x, y: -b.dir.y };
  }
}

/** The head hit something fatal: a life goes, and the password starts again unless that was the last one. */
function loseLife(s: PyState, msg: string): void {
  s.lives--;
  message(s, 0.38, msg, 'danger');
  if (s.lives <= 0) return gameOver(s);
  resetSnake(s);
  s.invulnT = cfg.invulnSeconds;
  s.mode = 'ready';
  s.readyT = cfg.lifeReadySeconds;
  message(s, 0.42, 'Start a new password!', 'plain');
}

/** Keeps the first `i` segments (head included) and drops the rest of the password. */
function chopAt(s: PyState, i: number, msg: string): void {
  const lost = s.chars.length - (i - 1);
  if (lost <= 0) return;
  s.snake.length = i;
  s.chars.length = i - 1;
  const p = s.snake[i - 1];
  floatAt(s, cx(p.x), cy(p.y) - 14, msg.replace('N', String(lost)), 'danger');
}

/** Each crack-time goal the password has now reached, once a run: a banner and a bonus, and play goes on. */
function checkGoals(s: PyState): void {
  while (s.goals < GOALS.length && crackLog(s.chars) >= goalFor(s.goals + 1).log) {
    s.goals++;
    const bonus = cfg.goalBonus * s.goals;
    s.score += bonus;
    message(s, 0.3, `Crack time: ${goalFor(s.goals).label} reached! +${bonus}`, 'gold');
  }
}

function gameOver(s: PyState): void {
  s.mode = 'over';
}

function updateBest(s: PyState): void {
  const l = crackLog(s.chars);
  if (l > s.stats.bestLog) {
    s.stats.bestLog = l;
    s.stats.bestPw = s.chars.map((c) => ({ ...c }));
  }
}

function floatAt(s: PyState, x: number, y: number, text: string, tone: Tone): void {
  s.floats.push({ x, y, text, tone, age: 0 });
}

/** A message across the middle of the board, `down` of the way from the top. */
function message(s: PyState, down: number, text: string, tone: Tone): void {
  floatAt(s, (s.cols * cfg.cell) / 2, s.rows * cfg.cell * down, text, tone);
}

function occupied(s: PyState, x: number, y: number): boolean {
  const at = (p: Pos) => p.x === x && p.y === y;
  return s.snake.some(at) || s.tiles.some(at) || s.weak.some(at) || s.powers.some(at) || s.bots.some(at);
}

/** A random empty cell at least `margin` steps from the head, or null if the board is full. */
function freeCell(s: PyState, rng: Rng, margin = 2): Pos | null {
  const h = s.snake[0];
  for (let i = 0; i < 300; i++) {
    const x = rnd(rng, s.cols);
    const y = rnd(rng, s.rows);
    if (occupied(s, x, y)) continue;
    if (h && Math.abs(h.x - x) + Math.abs(h.y - y) <= margin) continue;
    return { x, y };
  }
  return null;
}

function spawnChar(s: PyState, rng: Rng): void {
  const c = freeCell(s, rng);
  if (!c) return;
  // Weights: lower 3, upper 2, digit 2, symbol 2 out of 9.
  const r = rnd(rng, 9);
  const type: CharType = r < 3 ? 'lower' : r < 5 ? 'upper' : r < 7 ? 'digit' : 'symbol';
  const set = TYPES[type].chars;
  s.tiles.push({ ...c, type, ch: set[rnd(rng, set.length)], ph: rng.next() * 6 });
}

/** The lessons page's list: each mistake kind once, with how often it happened. */
export function mistakeCounts(mistakes: readonly Mistake[]): { kind: Mistake; count: number }[] {
  const counts = new Map<Mistake, number>();
  for (const m of mistakes) counts.set(m, (counts.get(m) ?? 0) + 1);
  return [...counts].map(([kind, count]) => ({ kind, count }));
}

export function lessonFor(kind: Mistake) {
  return LESSONS[kind];
}
