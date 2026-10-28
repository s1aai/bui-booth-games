import { useEffect, useLayoutEffect, useReducer, useRef, type PointerEvent } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import type { GameResult, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { fitCanvas, useStageSize } from '../../shell/useStageSize';
import { BYTE_GUARD_CONFIG as cfg } from './config';
import { KINDS, type ItemKind } from './data';
import { drawScene, placeWorld } from './draw';
import {
  byteGuardReducer,
  createRun,
  clock,
  mistakeCounts,
  worldWidth,
  type ByteGuardState,
  type Controls,
} from './logic';
import './byteguard.css';

type Lesson = GameResult['lessons'][number];

/** What the lessons page says about each kind of mistake. */
function lessonFor(kind: ItemKind, count: number): Lesson {
  const info = KINDS[kind];
  // The tag is already the picture beside the title, so the title says it in ordinary words.
  const name = info.tag.toLowerCase();
  return {
    outcome: 'missed',
    title: info.good
      ? `You zapped ${/^[aeiou]/.test(name) ? 'an' : 'a'} ${name} file`
      : `${name[0].toUpperCase()}${name.slice(1)} got past you`,
    text: count > 1 ? `${info.lesson} (${count} times)` : info.lesson,
    visual: <code className="bb-lesson__tag">{info.tag}</code>,
  };
}

function toResult(state: ByteGuardState): GameResult {
  return {
    score: state.score,
    complete: false,
    title: 'Server down!',
    reason: `You held out for ${clock(state.time)}.`,
    stats: [
      { label: 'Threats zapped', value: String(state.stats.zapped) },
      { label: 'Files delivered', value: String(state.stats.delivered) },
      { label: 'Best combo', value: `x${state.stats.bestCombo}` },
    ],
    lessons: mistakeCounts(state.mistakes).map(({ kind, count }) => lessonFor(kind, count)),
  };
}

/** Keys that steer or zap, and the held-state each one sets. */
const KEY_ACTIONS: Record<string, 'left' | 'right' | 'fire'> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'fire',
  KeyW: 'fire',
  ArrowUp: 'fire',
};

interface Input {
  left: boolean;
  right: boolean;
  fire: boolean;
  /** A tap, click or zap key zaps once: set on press, cleared once a frame has read it. */
  tap: boolean;
  /** Where a pointer is dragging Guardie, in game units. */
  pointerX: number | null;
}

/**
 * Byte Guard: files and threats fall toward the home server. Catch the good files with Guardie, zap the threats
 * with bolts, and keep the server up. Three hearts and it's over.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(byteGuardReducer, undefined, () =>
    createRun(Math.floor(Math.random() * 2 ** 32)),
  );
  const input = useRef<Input>({ left: false, right: false, fire: false, tap: false, pointerX: null });
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fontRef = useRef('sans-serif');
  const size = useStageSize(boardRef);
  const started = useRef(false);

  // Read by the key and pointer handlers, so they never see a stale mode.
  const modeRef = useRef(state.mode);
  modeRef.current = state.mode;

  // The run starts on a world as wide as the screen's shape, once it has been measured, before anything is drawn.
  // Resizing later keeps the world and only rescales it.
  useLayoutEffect(() => {
    if (!size || started.current) return;
    started.current = true;
    dispatch({ type: 'start', width: worldWidth(size.width, size.height) });
  }, [size]);

  useFrameClock(state.mode === 'play', (ms) => {
    const i = input.current;
    const controls: Controls = {
      steer: (Number(i.right) - Number(i.left)) as Controls['steer'],
      pointerX: i.pointerX,
      fire: i.fire || i.tap,
    };
    i.tap = false;
    dispatch({ type: 'tick', ms, controls });
  });

  // Keys: arrows or A/D steer, Space/W/Up zap, P or Esc pauses. Pausing also drops anything held, so the
  // player doesn't come back to Guardie still sliding.
  useEffect(() => {
    const pause = () => {
      input.current = { left: false, right: false, fire: false, tap: false, pointerX: null };
      dispatch({ type: 'pause' });
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (!e.repeat) {
          if (modeRef.current === 'pause') dispatch({ type: 'resume' });
          else pause();
        }
        e.preventDefault();
        return;
      }
      // While a button has focus (the Resume and Continue buttons), leave its Space and arrow keys alone.
      if (modeRef.current !== 'play') return;
      const action = KEY_ACTIONS[e.code];
      if (!action) return;
      e.preventDefault();
      input.current[action] = true;
      // A press shorter than a frame would otherwise be gone before the frame reads it.
      if (action === 'fire') input.current.tap = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const action = KEY_ACTIONS[e.code];
      if (action) input.current[action] = false;
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Draw on every change. The pause screen doesn't change, so the picture stays still.
  useEffect(() => {
    fontRef.current = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif';
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !size) return;
    const dpr = fitCanvas(canvas, size.width, size.height);
    drawScene(ctx, state, performance.now(), fontRef.current, { ...size, dpr });
  }, [state, size]);

  // After the last heart, hold the final picture for a moment, then the lessons.
  useEffect(() => {
    if (state.mode !== 'over') return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  // Game coordinates: where the pointer is across the world, wherever the world sits on the stage.
  const toGameX = (e: PointerEvent<HTMLCanvasElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const at = placeWorld(box, state.width);
    return (e.clientX - box.left - at.x) / at.k;
  };
  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    input.current.pointerX = toGameX(e);
    input.current.tap = true;
  };
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons & 1) input.current.pointerX = toGameX(e);
  };
  const onPointerUp = () => {
    input.current.pointerX = null;
  };

  const resume = () => dispatch({ type: 'resume' });

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <Stat label="Time">{clock(state.time)}</Stat>
      </Header>
      <main className="bb">
        <p className="bb__hint">
          <span className="bb__hint-keys">
            <Icon name="arrow-left" /> <Icon name="arrow-right" /> Move <Icon name="bug" /> Space or tap to zap
            <span> · P to pause</span>
          </span>
          <span className="bb__hint-touch">Drag to move · tap to zap</span>
        </p>
        <div ref={boardRef} className={state.mode === 'over' ? 'bb__board bb__board--over' : 'bb__board'}>
          <canvas
            ref={canvasRef}
            className="bb__canvas"
            role="img"
            aria-label="Byte Guard: catch the good files, zap the threats, keep the server up"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          {state.mode === 'pause' && (
            <div className="bb__overlay">
              <h2 className="bb__overlay-title">Paused</h2>
              <button type="button" className="btn btn--primary" onClick={resume} autoFocus>
                Resume
              </button>
              <p className="bb__overlay-note">Press P or Esc to carry on.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
