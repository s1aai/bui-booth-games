import { PYTHON_PW_CONFIG as cfg } from './config';
import { ART, GUESSES, PALETTE, TYPE_ORDER, TYPES, type CharType } from './data';
import { cx, cy, hudHeight, hudScale, type Pos, type PyState, type Tone } from './logic';
import { crackLog, fmtCrack, goalFor } from './strength';
import { fade, themeColour } from '../../shell/canvasColours';
import type { View } from '../../shell/useStageSize';

const BOARD_BG = '--game-board';
const BODY_BG = '--game-accent-dark';

type Sprite = keyof typeof ART;

/** The pixel art, drawn once to a small canvas each and reused. The bot fills a cell; the power-ups are finer. */
const sprites = new Map<Sprite, HTMLCanvasElement>();
const SCALE: Record<Sprite, number> = { bot: 3, mfa: 2, vault: 2, backup: 2 };

function sprite(key: Sprite): HTMLCanvasElement {
  const cached = sprites.get(key);
  if (cached) return cached;
  const rows = ART[key];
  const px = SCALE[key];
  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length * px;
  canvas.height = rows.length * px;
  const ctx = canvas.getContext('2d');
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (!ctx || !PALETTE[ch]) return;
      ctx.fillStyle = themeColour(PALETTE[ch]);
      ctx.fillRect(x * px, y * px, px, px);
    }),
  );
  sprites.set(key, canvas);
  return canvas;
}

const TONE_COLOR: Record<Exclude<Tone, CharType>, string> = {
  danger: themeColour(PALETTE.R),
  gold: themeColour(PALETTE.Y),
  shield: themeColour(PALETTE.C),
  power: themeColour(PALETTE.G),
  plain: themeColour(PALETTE.w),
};

function toneColor(t: Tone): string {
  if (t === 'danger' || t === 'gold' || t === 'shield' || t === 'power' || t === 'plain') return TONE_COLOR[t];
  return themeColour(TYPES[t].color);
}

/**
 * Where a piece is drawn between two cells: `f` of the way from `from` to `to`. A jump of more than one cell (a reset,
 * or a segment that was just added) is not a glide, so it snaps to `to`.
 */
function glide(from: Pos, to: Pos, f: number): { x: number; y: number } {
  if (Math.abs(from.x - to.x) + Math.abs(from.y - to.y) > 1) return { x: cx(to.x), y: cy(to.y) };
  return { x: cx(from.x) + (cx(to.x) - cx(from.x)) * f, y: cy(from.y) + (cy(to.y) - cy(from.y)) * f };
}

/** The bob, blink and pulse stop for people who ask for less motion. */
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Draws one frame across the whole stage: the HUD band along the top at its own size, and the board under it in game
 * units, scaled to the biggest cells that fit and centred. `now` is in ms and drives the animation (the bob, the
 * blink, the shield pulse), so pausing the game leaves the picture still. `font` is the theme's font.
 */
export function drawScene(ctx: CanvasRenderingContext2D, s: PyState, now: number, font: string, view: View): void {
  const still = reducedMotion();
  const hud = hudHeight(view.width);
  const cell = Math.min(view.width / s.cols, (view.height - hud) / s.rows);
  ctx.save();
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  // Without this, Chrome spaces small text unevenly once it's scaled ("ab cd?").
  ctx.textRendering = 'geometricPrecision';
  ctx.fillStyle = themeColour(BOARD_BG);
  ctx.fillRect(0, 0, view.width, view.height);
  drawHud(ctx, s, font, view.width, hud);
  ctx.translate((view.width - s.cols * cell) / 2, hud + (view.height - hud - s.rows * cell) / 2);
  ctx.scale(cell / cfg.cell, cell / cfg.cell);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawBoard(ctx, s, now, still, font);
  if (s.mode === 'ready') drawReady(ctx, s, font);
  if (s.mode === 'over') drawOver(ctx, s, font);
  ctx.restore();
}

function drawBoard(ctx: CanvasRenderingContext2D, s: PyState, now: number, still: boolean, font: string) {
  const boardW = s.cols * cfg.cell;
  const boardH = s.rows * cfg.cell;
  // Grid lines one screen pixel wide, whatever the scale.
  const hair = 1 / ctx.getTransform().a;
  ctx.strokeStyle = fade(themeColour('--game-info'), 0.06);
  ctx.lineWidth = hair;
  for (let x = 0; x <= s.cols; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cfg.cell, 0);
    ctx.lineTo(x * cfg.cell, boardH);
    ctx.stroke();
  }
  for (let y = 0; y <= s.rows; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cfg.cell);
    ctx.lineTo(boardW, y * cfg.cell);
    ctx.stroke();
  }
  // The firewall round the edge.
  ctx.strokeStyle = themeColour('--game-board-line');
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, boardW - 2, boardH - 2);

  const box = cfg.cell - 6;
  const blinkOff = (ttl: number) => ttl < 2 && !still && Math.floor(now / 150) % 2 === 0;

  // Weak words: red pills, blinking as they're about to go.
  ctx.font = `bold 11px ${font}`;
  for (const w of s.weak) {
    const x = cx(w.x);
    const y = cy(w.y);
    const pillW = ctx.measureText(w.word).width + 10;
    ctx.globalAlpha = blinkOff(w.ttl) ? 0.35 : 1;
    ctx.fillStyle = fade(themeColour('--game-danger'), 0.2);
    ctx.fillRect(x - pillW / 2, y - 9, pillW, 18);
    ctx.strokeStyle = themeColour(PALETTE.R);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - pillW / 2, y - 9, pillW, 18);
    ctx.fillStyle = themeColour(PALETTE.r);
    ctx.fillText(w.word, x, y + 1);
  }

  // Power-ups.
  for (const p of s.powers) {
    const img = sprite(p.kind);
    ctx.globalAlpha = blinkOff(p.ttl) ? 0.35 : 1;
    ctx.drawImage(img, cx(p.x) - img.width / 2, cy(p.y) - img.height / 2);
  }

  // Characters: each bobs on its own phase.
  ctx.globalAlpha = 1;
  ctx.font = `bold 16px ${font}`;
  for (const t of s.tiles) {
    const x = cx(t.x);
    const y = cy(t.y) + (still ? 0 : Math.sin(now / 300 + t.ph) * 2);
    const color = themeColour(TYPES[t.type].color);
    ctx.fillStyle = themeColour(BODY_BG);
    ctx.fillRect(x - box / 2, y - box / 2, box, box);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - box / 2 + 1, y - box / 2 + 1, box - 2, box - 2);
    ctx.fillStyle = color;
    ctx.fillText(t.ch, x, y + 1);
  }

  // Bots, with the guess they're trying above them. A stunned bot is faded.
  const bot = sprite('bot');
  ctx.font = `bold 10px ${font}`;
  for (const b of s.bots) {
    const { x, y } = glide(b.prev, b, b.stun > 0 ? 1 : Math.min(1, b.acc));
    ctx.globalAlpha = b.stun > 0 ? 0.4 : 1;
    ctx.drawImage(bot, x - bot.width / 2, y - bot.height / 2);
    if (b.stun <= 0) {
      ctx.fillStyle = themeColour(PALETTE.R);
      ctx.fillText(GUESSES[b.id % GUESSES.length], x, y - cfg.cell / 2 - 5);
    }
  }
  ctx.globalAlpha = 1;

  // The snake: the head is bright and the body wears the password, one character a segment.
  // Segment i came from the cell segment i was in before the last step, so it glides from there.
  const f = Math.min(1, s.moveAcc);
  for (let i = s.snake.length - 1; i >= 0; i--) {
    const p = s.snake[i];
    const { x, y } = glide(s.prevSnake[Math.min(i, s.prevSnake.length - 1)] ?? p, p, f);
    const size = cfg.cell - 4;
    if (i === 0) {
      ctx.globalAlpha = s.invulnT > 0 && !still && Math.floor(now / 120) % 2 === 0 ? 0.4 : 1;
      ctx.fillStyle = themeColour('--game-paper');
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.strokeStyle = themeColour(PALETTE.G);
      ctx.lineWidth = 2;
      ctx.strokeRect(x - size / 2 + 1, y - size / 2 + 1, size - 2, size - 2);
      if (s.shieldT > 0) {
        ctx.globalAlpha = still ? 0.8 : 0.5 + 0.3 * Math.sin(now / 150);
        ctx.strokeStyle = themeColour(PALETTE.C);
        ctx.beginPath();
        ctx.arc(x, y, cfg.cell * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      const c = s.chars[i - 1];
      const color = c ? themeColour(TYPES[c.type].color) : themeColour(PALETTE.S);
      ctx.fillStyle = themeColour(BODY_BG);
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - size / 2 + 0.75, y - size / 2 + 0.75, size - 1.5, size - 1.5);
      if (c) {
        ctx.fillStyle = color;
        ctx.font = `bold 14px ${font}`;
        ctx.fillText(c.ch, x, y + 1);
      }
    }
  }

  // Score text that floats up and fades.
  ctx.font = `bold 13px ${font}`;
  for (const f of s.floats) {
    ctx.globalAlpha = Math.max(0, 1 - f.age / cfg.floatSeconds);
    ctx.fillStyle = toneColor(f.tone);
    ctx.fillText(f.text, f.x, f.y - f.age * 24);
  }
  ctx.globalAlpha = 1;
}

/** A heart in the pixel style of Byte Guard's HUD, 7 by 6 pixels of `px`. Full hearts are red, empty ones grey. */
function heart(ctx: CanvasRenderingContext2D, x: number, y: number, full: boolean, px: number): void {
  const rows = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch !== '.') {
        ctx.fillStyle = full ? themeColour(PALETTE.R) : themeColour('--game-slate');
        ctx.fillRect(x + i * px, y + j * px, px, px);
      }
    }),
  );
}

/**
 * The HUD band above the board: the hearts, the password so far, the kind counts, the crack meter and its goal. It
 * sits on the canvas in Byte Guard's plain style, in screen pixels so it reads the same on any board. A wide screen
 * has it all in one row; a narrower one stacks it.
 */
function drawHud(ctx: CanvasRenderingContext2D, s: PyState, font: string, width: number, hud: number): void {
  const pad = 16;
  const goal = goalFor(s.goals + 1);
  const log = crackLog(s.chars);
  const fill = Math.max(0, Math.min(1, log / goal.log));
  // As many heart slots as the run started with, more only once a BACKUP adds one: a new run shows no empty hearts.
  // The one-row HUD still keeps room for maxLives, so nothing shifts when one is added.
  const hearts = Math.max(cfg.lives, s.lives);
  ctx.save();
  ctx.strokeStyle = themeColour('--game-board-line');
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, hud - 0.5);
  ctx.lineTo(width, hud - 0.5);
  ctx.stroke();
  ctx.textBaseline = 'middle';

  if (width >= cfg.hudWideFromPx) {
    // Laid out as on a screen hudScaleFromPx wide, then scaled up, so the text grows with a bigger screen.
    const k = hudScale(width);
    const w = width / k;
    const h = hud / k;
    ctx.scale(k, k);
    // From the right: hearts, the meter with its two lines, the kind chips, and the password in the room left.
    const heartsX = w - pad - (cfg.maxLives * 34 - 6);
    for (let i = 0; i < hearts; i++) heart(ctx, w - pad - 28 - i * 34, h / 2 - 12, i < s.lives, 4);
    const meterW = 240;
    const meterX = heartsX - 24 - meterW;
    ctx.font = `13px ${font}`;
    ctx.fillStyle = themeColour('--game-mist');
    ctx.textAlign = 'left';
    ctx.fillText(`Crack time: ${fmtCrack(log)}`, meterX, h / 2 - 15, meterW);
    ctx.fillText(`Goal: ${goal.label}`, meterX, h / 2 + 16, meterW);
    drawMeter(ctx, meterX, h / 2 - 3, meterW, 7, fill);
    const chipsW = 290;
    const chipsX = meterX - 24 - chipsW;
    drawChips(ctx, s, font, chipsX, h / 2 - 15, chipsW, 30, 14);
    ctx.font = `bold 11px ${font}`;
    ctx.fillStyle = themeColour('--game-mist');
    ctx.textAlign = 'left';
    ctx.fillText('PASSWORD', pad, h / 2 - 15);
    drawPassword(ctx, s, font, pad, h / 2 + 9, chipsX - 24 - pad, 22);
  } else {
    const inner = width - pad * 2;
    ctx.font = `bold 11px ${font}`;
    ctx.fillStyle = themeColour('--game-mist');
    ctx.textAlign = 'left';
    ctx.fillText('PASSWORD', pad, 16);
    for (let i = 0; i < hearts; i++) heart(ctx, width - pad - 21 - i * 25, 7, i < s.lives, 3);
    drawPassword(ctx, s, font, pad, 42, inner, 20);
    drawChips(ctx, s, font, pad, 60, inner, 26, 13);
    drawMeter(ctx, pad, 94, inner, 6, fill);
    const goalText = `Goal: ${goal.label}`;
    ctx.font = `12px ${font}`;
    ctx.fillStyle = themeColour('--game-mist');
    ctx.textAlign = 'right';
    ctx.fillText(goalText, width - pad, 114);
    ctx.textAlign = 'left';
    ctx.fillText(`Crack time: ${fmtCrack(log)}`, pad, 114, inner - ctx.measureText(goalText).width - 12);
  }
  ctx.restore();
}

/** The password so far, one coloured character each: the newest that fit in `maxW`, with an ellipsis for the rest. */
function drawPassword(ctx: CanvasRenderingContext2D, s: PyState, font: string, x: number, y: number, maxW: number, size: number) {
  ctx.textAlign = 'left';
  if (s.chars.length === 0) {
    ctx.font = `${Math.round(size * 0.65)}px ${font}`;
    ctx.fillStyle = themeColour('--game-mist');
    ctx.fillText('eat characters to build it', x, y, maxW);
    return;
  }
  ctx.font = `bold ${size}px ${font}`;
  const widths = s.chars.map((c) => ctx.measureText(c.ch).width);
  let total = widths.reduce((a, b) => a + b, 0);
  let first = 0;
  if (total > maxW) {
    const dots = ctx.measureText('…').width + 2;
    while (total > maxW - dots) total -= widths[first++];
    ctx.fillStyle = themeColour('--game-mist');
    ctx.fillText('…', x, y);
    x += dots;
  }
  for (let i = first; i < s.chars.length; i++) {
    ctx.fillStyle = themeColour(TYPES[s.chars[i].type].color);
    ctx.fillText(s.chars[i].ch, x, y);
    x += widths[i];
  }
}

/** The four kinds, each in its colour with its count: dimmer until the password has one. */
function drawChips(ctx: CanvasRenderingContext2D, s: PyState, font: string, x: number, y: number, w: number, h: number, size: number) {
  const gap = 6;
  const chipW = (w - gap * (TYPE_ORDER.length - 1)) / TYPE_ORDER.length;
  ctx.font = `bold ${size}px ${font}`;
  ctx.textAlign = 'center';
  TYPE_ORDER.forEach((type, i) => {
    const count = s.chars.filter((c) => c.type === type).length;
    const color = themeColour(TYPES[type].color);
    const chipX = x + i * (chipW + gap);
    ctx.globalAlpha = count > 0 ? 1 : 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(chipX + 1, y + 1, chipW - 2, h - 2);
    ctx.fillStyle = color;
    ctx.fillText(`${TYPES[type].label} ${count}`, chipX + chipW / 2, y + h / 2 + 1);
  });
  ctx.globalAlpha = 1;
}

/** The crack meter: how close the password is to the next goal. */
function drawMeter(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: number) {
  ctx.fillStyle = themeColour('--game-band');
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = themeColour(fill >= 1 ? '--game-good' : '--game-info');
  ctx.fillRect(x, y, w * fill, h);
}

function drawReady(ctx: CanvasRenderingContext2D, s: PyState, font: string) {
  const w = s.cols * cfg.cell;
  const h = s.rows * cfg.cell;
  ctx.fillStyle = fade(themeColour('--game-board'), 0.6);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = themeColour(PALETTE.w);
  ctx.font = `bold 22px ${font}`;
  ctx.fillText('GET READY', w / 2, h * 0.28);
  ctx.font = `bold 48px ${font}`;
  ctx.fillStyle = themeColour(PALETTE.C);
  ctx.fillText(String(Math.max(1, Math.ceil(s.readyT))), w / 2, h * 0.4);
}

function drawOver(ctx: CanvasRenderingContext2D, s: PyState, font: string) {
  const w = s.cols * cfg.cell;
  const h = s.rows * cfg.cell;
  ctx.fillStyle = fade(themeColour('--game-board'), 0.6);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = themeColour(PALETTE.R);
  ctx.font = `bold 30px ${font}`;
  ctx.fillText('CRACKED!', w / 2, h * 0.45);
}
