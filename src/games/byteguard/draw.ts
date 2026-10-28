import { BYTE_GUARD_CONFIG as cfg } from './config';
import { ART, KINDS, PALETTE, TONES, artScale, itemSize, type ItemKind } from './data';
import { fade, themeColour } from '../../shell/canvasColours';
import type { StageSize, View } from '../../shell/useStageSize';
import { clock, comboOf, type ByteGuardState, type Item } from './logic';

/** The pixel art, drawn once to a small canvas each and reused. */
const sprites = new Map<ItemKind | 'guard', HTMLCanvasElement>();

function sprite(key: ItemKind | 'guard'): HTMLCanvasElement {
  const cached = sprites.get(key);
  if (cached) return cached;
  const rows = ART[key];
  const px = artScale(key);
  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length * px;
  canvas.height = rows.length * px;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (PALETTE[ch]) {
          ctx.fillStyle = themeColour(PALETTE[ch]);
          ctx.fillRect(x * px, y * px, px, px);
        }
      }),
    );
  }
  sprites.set(key, canvas);
  return canvas;
}

/** The rain, blinks and pulses stop for people who ask for less motion. */
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Where the world sits on a stage `worldWidth` units wide: its scale (CSS pixels per game unit) and its top-left
 * corner. It fills the stage, unless the stage is a shape the world's width limits can't reach; then it's centred.
 */
export function placeWorld(stage: StageSize, worldWidth: number): { k: number; x: number; y: number } {
  const k = Math.min(stage.height / cfg.height, stage.width / worldWidth);
  return { k, x: (stage.width - worldWidth * k) / 2, y: (stage.height - cfg.height * k) / 2 };
}

/**
 * Draws one frame across the whole stage. `clock` is in ms and drives the animation (the rain, the blinking lights,
 * the pulse), so pausing the game leaves the picture still. With reduced motion the clock stays at 0, so those
 * effects hold still. `font` is the theme's font, for the canvas text.
 */
export function drawScene(ctx: CanvasRenderingContext2D, s: ByteGuardState, clock: number, font: string, view: View): void {
  const now = reducedMotion() ? 0 : clock;
  const W = s.width;
  const { height: H, groundY } = cfg;
  const at = placeWorld(view, W);
  ctx.save();
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  ctx.fillStyle = themeColour('--game-board');
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.translate(at.x, at.y);
  ctx.scale(at.k, at.k);
  ctx.imageSmoothingEnabled = false;
  // Without this, Chrome spaces small text unevenly once it's scaled ("HOME S ER VER").
  ctx.textRendering = 'geometricPrecision';

  ctx.strokeStyle = fade(themeColour('--game-board-line'), 0.35);
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, groundY);
    ctx.stroke();
  }

  // Binary rain: each column falls at its own speed, wrapping round.
  ctx.font = `12px ${font}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = fade(themeColour('--game-info'), 0.11);
  for (let i = 0; i < Math.ceil(W / 19); i++) {
    const speed = 20 + ((i * 37) % 40);
    const y = ((now / 1000) * speed + i * 97) % (H + 20) - 10;
    ctx.fillText(i % 2 ? '1' : '0', i * 19 + 6, y);
  }

  // The internet, as a cloud along the top.
  ctx.fillStyle = themeColour(PALETTE.T);
  for (let i = 0; i <= Math.ceil(W / 60); i++) {
    ctx.beginPath();
    ctx.arc(i * 60 + 10, 4, 34 + (i % 2) * 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = themeColour(PALETTE.S);
  ctx.font = `9px ${font}`;
  ctx.fillText('THE INTERNET', W / 2, 14);

  drawServer(ctx, s, now, font);

  if (s.slowLeft > 0) {
    ctx.fillStyle = fade(themeColour('--game-good'), 0.06);
    ctx.fillRect(0, 0, W, groundY);
  }
  for (const item of s.items) drawItem(ctx, item, s, now, font);

  ctx.fillStyle = themeColour(PALETTE.C);
  for (const bolt of s.bolts) {
    ctx.fillRect(bolt.x - 2, bolt.y - 10, 4, 14);
    ctx.fillStyle = fade(themeColour('--game-info'), 0.3);
    ctx.fillRect(bolt.x - 4, bolt.y - 12, 8, 18);
    ctx.fillStyle = themeColour(PALETTE.C);
  }

  const guard = sprite('guard');
  if (s.shield) {
    ctx.strokeStyle = themeColour(PALETTE.C);
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(now / 120);
    ctx.beginPath();
    ctx.arc(s.playerX, cfg.playerY, 44, Math.PI, 0);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(guard, Math.round(s.playerX - guard.width / 2), cfg.playerY - guard.height / 2);

  ctx.font = `11px ${font}`;
  for (const float of s.floats) {
    ctx.globalAlpha = Math.max(0, 1 - float.age / cfg.floatSeconds);
    ctx.fillStyle = themeColour(TONES[float.tone]);
    ctx.textAlign = 'center';
    ctx.fillText(float.text, float.x, float.y);
  }
  ctx.globalAlpha = 1;

  drawHud(ctx, s, font);
  if (s.flashLeft > 0) {
    ctx.fillStyle = fade(themeColour('--game-danger-deep'), (s.flashLeft / cfg.flashSeconds) * 0.8);
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function drawServer(ctx: CanvasRenderingContext2D, s: ByteGuardState, now: number, font: string): void {
  const W = s.width;
  const { height: H, groundY } = cfg;
  const hit = s.serverHitLeft > 0;
  ctx.fillStyle = themeColour('--game-board');
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = hit ? themeColour(PALETTE.r) : themeColour('--game-slate');
  ctx.fillRect(0, groundY, W, 3);
  for (let i = 0; i < Math.ceil(W / 40); i++) {
    const x = i * 40 + 6;
    ctx.fillStyle = themeColour(PALETTE.T);
    ctx.fillRect(x, groundY + 8, 28, 30);
    for (let j = 0; j < 3; j++) {
      const on = (Math.floor(now / 300) + i * 3 + j) % 5 !== 0;
      ctx.fillStyle = hit ? themeColour(PALETTE.R) : on ? (j === 1 ? themeColour(PALETTE.Y) : themeColour(PALETTE.g)) : themeColour('--game-slate');
      ctx.fillRect(x + 4, groundY + 12 + j * 9, 4, 4);
      ctx.fillStyle = themeColour('--game-slate');
      ctx.fillRect(x + 11, groundY + 13 + j * 9, 13, 2);
    }
  }
  ctx.font = `10px ${font}`;
  ctx.textAlign = 'center';
  // A strip of board behind the label, so the lights don't show through it.
  const labelW = ctx.measureText('HOME SERVER').width + 12;
  ctx.fillStyle = themeColour('--game-board');
  ctx.fillRect(W / 2 - labelW / 2, H - 11, labelW, 11);
  ctx.fillStyle = themeColour(PALETTE.S);
  ctx.fillText('HOME SERVER', W / 2, H - 2);
}

function drawItem(ctx: CanvasRenderingContext2D, item: Item, s: ByteGuardState, now: number, font: string): void {
  const info = KINDS[item.kind];
  const art = sprite(item.kind);
  const { w, h } = itemSize(item.kind);
  // From sneakyFromSeconds, phishing emails look like ordinary mail: no red glow, and the label says so.
  const sneaky = item.kind === 'phish' && s.time >= cfg.sneakyFromSeconds;
  if (!info.good && !info.power && !sneaky) {
    const pulse = 0.35 + 0.25 * Math.sin(now / 140);
    ctx.fillStyle = fade(themeColour('--game-danger-deep'), pulse);
    ctx.beginPath();
    ctx.arc(item.x, item.y, w * 0.72, 0, Math.PI * 2);
    ctx.fill();
  } else if (info.power) {
    ctx.strokeStyle = themeColour(PALETTE.g);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(item.x, item.y, w * 0.75, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.drawImage(art, Math.round(item.x - art.width / 2), Math.round(item.y - art.height / 2));
  ctx.font = `9px ${font}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = info.power ? themeColour(PALETTE.g) : info.good || sneaky ? themeColour(PALETTE.Y) : themeColour(PALETTE.M);
  ctx.fillText(sneaky ? 'EMAIL?' : info.tag, item.x, item.y + h / 2 + 11);
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, full: boolean): void {
  const rows = ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'];
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      if (ch !== '.') {
        ctx.fillStyle = full ? themeColour(PALETTE.R) : themeColour('--game-slate');
        ctx.fillRect(x + i * 3, y + j * 3, 3, 3);
      }
    }),
  );
}

function drawHud(ctx: CanvasRenderingContext2D, s: ByteGuardState, font: string): void {
  ctx.textAlign = 'left';
  ctx.fillStyle = themeColour(TONES.gold);
  ctx.font = `bold 18px ${font}`;
  ctx.fillText(String(s.score).padStart(6, '0'), 12, 44);
  ctx.font = `10px ${font}`;
  ctx.fillStyle = themeColour(PALETTE.S);
  ctx.fillText(`TIME ${clock(s.time)}`, 12, 58);
  const combo = comboOf(s.streak);
  if (combo > 1) {
    ctx.fillStyle = themeColour(PALETTE.g);
    ctx.fillText(`COMBO x${combo}`, 80, 58);
  }
  // As many slots as the run started with, more only once a backup adds one: a new run shows no empty hearts.
  const slots = Math.max(cfg.lives, s.lives);
  for (let i = 0; i < slots; i++) heart(ctx, s.width - 30 - i * 25, 32, i < s.lives);

  if (s.slowLeft > 0) {
    ctx.fillStyle = themeColour(PALETTE.g);
    ctx.textAlign = 'right';
    ctx.fillText(`UPDATE PATCH: SLOW-MO ${Math.ceil(s.slowLeft)}`, s.width - 12, 62);
  }
}
