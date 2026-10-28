import { useEffect, useLayoutEffect, useReducer, useRef, type MouseEvent, type PointerEvent } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import type { GameResult, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { fitCanvas, useStageSize } from '../../shell/useStageSize';
import { PYTHON_PW_CONFIG as cfg } from './config';
import { LESSONS } from './data';
import { drawScene } from './draw';
import { boardFor, createRun, mistakeCounts, pyReducer, type DirName, type Mistake, type PyState } from './logic';
import { GOALS, fmtCrack } from './strength';
import './pythonpw.css';

type Lesson = GameResult['lessons'][number];

/** What the lessons page says about each kind of mistake. */
function lessonFor(kind: Mistake, count: number): Lesson {
  const info = LESSONS[kind];
  return {
    outcome: 'missed',
    title: info.title,
    text: count > 1 ? `${info.text} (${count} times)` : info.text,
  };
}

function toResult(state: PyState): GameResult {
  return {
    score: state.score,
    complete: false,
    title: 'Password cracked!',
    reason: `You held out for ${clock(state.time)}.`,
    stats: [
      { label: 'Characters eaten', value: String(state.stats.eaten) },
      { label: 'Goals reached', value: `${state.goals} of ${GOALS.length}` },
      { label: 'Strongest', value: state.stats.bestLog > -Infinity ? fmtCrack(state.stats.bestLog) : 'none' },
    ],
    lessons: mistakeCounts(state.mistakes).map(({ kind, count }) => lessonFor(kind, count)),
  };
}

/** Keys that steer: arrows or WASD. */
const KEY_TURNS: Record<string, DirName> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

/** How far a finger must travel before a swipe counts as a turn, in screen pixels. */
const SWIPE_PX = 24;

/** Seconds as m:ss, for the time in the header and on the results. */
function clock(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Password Python: steer the snake through the board to eat characters and build a password. Each crack-time goal
 * it reaches earns a bonus. Weak words, guess-bots and three hearts stand in the way, faster the longer it goes.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(pyReducer, undefined, () => createRun(Math.floor(Math.random() * 2 ** 32)));
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fontRef = useRef('sans-serif');
  const size = useStageSize(stageRef);
  const started = useRef(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  // Read by the key handlers, so they never see a stale mode.
  const modeRef = useRef(state.mode);
  modeRef.current = state.mode;

  // The run starts on a board sized to the screen, once it has been measured, before anything is drawn. Resizing
  // later keeps the board and only rescales it.
  useLayoutEffect(() => {
    if (!size || started.current) return;
    started.current = true;
    dispatch({ type: 'start', board: boardFor(size.width, size.height) });
  }, [size]);

  useFrameClock(state.mode === 'ready' || state.mode === 'play', (ms) => dispatch({ type: 'tick', ms }));

  // Keys: arrows or WASD steer, P or Esc pauses. Pausing from anywhere else (blur, hidden tab) does the same.
  useEffect(() => {
    const pause = () => dispatch({ type: 'pause' });
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
      const dir = KEY_TURNS[e.code];
      if (!dir) return;
      e.preventDefault();
      dispatch({ type: 'turn', dir });
    };
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // The canvas font is the theme's, so the picture matches the rest of the page.
  useEffect(() => {
    fontRef.current = getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() || 'sans-serif';
  }, []);

  // Draw on every change, sharp at the stage's size. The pause screen doesn't change, so the picture stays still.
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

  // A swipe of the finger turns the snake the way it moved, as soon as it has gone far enough (not when the finger
  // lifts, which can be a few steps too late). One turn per swipe.
  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    swipeStart.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const start = swipeStart.current;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    swipeStart.current = null;
    const dir: DirName = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    dispatch({ type: 'turn', dir });
  };

  const turn = (dir: DirName) => dispatch({ type: 'turn', dir });
  // The arrows turn on press, not release, like a swipe: a turn a moment late is a wall. Keyboard and screen readers
  // use onClick.
  const padPress = (dir: DirName) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button === 0) turn(dir);
    },
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      if (e.detail === 0) turn(dir);
    },
  });
  const resume = () => dispatch({ type: 'resume' });

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <Stat label="Time">{clock(state.time)}</Stat>
      </Header>
      <main className="py">
        <div ref={stageRef} className={state.mode === 'over' ? 'py__stage py__stage--over' : 'py__stage'}>
          <canvas
            ref={canvasRef}
            className="py__canvas"
            role="img"
            aria-label="Password Python: steer the snake to eat characters and build a strong password"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (swipeStart.current = null)}
            onPointerCancel={() => (swipeStart.current = null)}
          />
          {state.mode === 'pause' && (
            <div className="py__overlay">
              <h2 className="py__overlay-title">Paused</h2>
              <button type="button" className="btn btn--primary" onClick={resume} autoFocus>
                Resume
              </button>
              <p className="py__overlay-note">Press P or Esc to carry on.</p>
            </div>
          )}
        </div>
        <div className="py__controls">
          <div className="py__pad" aria-label="Steering buttons">
            <button type="button" className="py-btn py-btn--up" aria-label="Up" {...padPress('up')}>
              <Icon name="arrow-right" />
            </button>
            <button type="button" className="py-btn py-btn--left" aria-label="Left" {...padPress('left')}>
              <Icon name="arrow-left" />
            </button>
            <button type="button" className="py-btn py-btn--right" aria-label="Right" {...padPress('right')}>
              <Icon name="arrow-right" />
            </button>
            <button type="button" className="py-btn py-btn--down" aria-label="Down" {...padPress('down')}>
              <Icon name="arrow-right" />
            </button>
          </div>
          <p className="py__how py__how--keys">
            <strong>Arrows</strong> or <strong>WASD</strong> to steer <span>· swipe on a touchscreen</span>{' '}
            <span>· <strong>P</strong> to pause</span>
          </p>
          <p className="py__how py__how--touch">
            <strong>Swipe</strong> or tap the <strong>arrows</strong> to steer
          </p>
        </div>
      </main>
    </>
  );
}
