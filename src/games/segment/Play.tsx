import { useEffect, useReducer, useRef, type CSSProperties, type PointerEvent } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import type { GameResult, Lesson, PlayProps } from '../../shell/types';
import { claimPointer, ownsPointer, releasePointer } from '../../shell/primaryPointer';
import { useFrameClock } from '../../shell/useFrameClock';
import { SEGMENT_CONFIG } from './config';
import { LINK_KINDS } from './data';
import { initialSegmentState, isConnected, roundFor, segmentReducer, type Cell, type SegmentState } from './logic';
import './segment.css';

const cfg = SEGMENT_CONFIG;
/** Drawing units per square of the board. */
const U = 100;

const colour = (kind: number) => ({ '--c': `var(--link-${kind + 1})` }) as CSSProperties;

/** A link's device and network, joined by a line in its colour: in the legend and the lessons. */
function LinkChip({ kind }: { kind: number }) {
  const k = LINK_KINDS[kind];
  return (
    <span className="seg-chip" style={colour(kind)} aria-hidden="true">
      <span className="seg-chip__end">
        <Icon name={k.deviceIcon} />
      </span>
      <span className="seg-chip__line" />
      <span className="seg-chip__end">
        <Icon name={k.networkIcon} />
      </span>
    </span>
  );
}

function toResult(state: SegmentState): GameResult {
  const lessons: Lesson[] = state.kindsSeen.map((kind) => ({
    outcome: state.kindsDone.includes(kind) ? 'found' : 'missed',
    title: `${LINK_KINDS[kind].device} → ${LINK_KINDS[kind].network}`,
    text: LINK_KINDS[kind].why,
    visual: <LinkChip kind={kind} />,
  }));
  return {
    score: state.score,
    complete: true,
    title: "Time's up!",
    reason: `${state.solved} ${state.solved === 1 ? 'network' : 'networks'} segmented.`,
    stats: [
      { label: 'Networks', value: String(state.solved) },
      { label: 'Biggest', value: state.largest ? `${state.largest} × ${state.largest}` : '–' },
    ],
    lessons,
  };
}

/**
 * Segment the Network, a Flow Free-style puzzle: join each device to its network with a line. Lines can't cross,
 * as network segments stay separate, and every square must be used. Puzzles grow from 5 x 5 to 7 x 7 against a
 * 90-second clock.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(segmentReducer, undefined, () =>
    initialSegmentState(Math.floor(Math.random() * 2 ** 32)),
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const finger = useRef<number | null>(null);
  useFrameClock(!state.over, (ms) => dispatch({ type: 'TICK', ms }));

  useEffect(() => {
    if (!state.over) return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  const { puzzle, paths } = state;
  const { size } = puzzle;
  const centre = (cell: Cell) => ({ x: (cell % size) * U + U / 2, y: Math.floor(cell / size) * U + U / 2 });

  /** The square under the finger, kept on the board when the finger strays off its edge. */
  const cellAt = (e: { clientX: number; clientY: number }) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const clamp = (v: number) => Math.min(size - 1, Math.max(0, Math.floor(v / U)));
    return clamp(p.y) * size + clamp(p.x);
  };
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const cell = cellAt(e);
    if (cell === null || e.button !== 0 || !claimPointer(finger, e.pointerId)) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    dispatch({ type: 'START_DRAW', cell });
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (state.drawing === null || !ownsPointer(finger, e.pointerId)) return;
    // Every point the finger passed since the last event, in order, so a quick flick round a corner goes round it.
    const points = e.nativeEvent.getCoalescedEvents?.() ?? [];
    for (const point of points.length > 0 ? points : [e]) {
      const cell = cellAt(point);
      if (cell !== null) dispatch({ type: 'DRAW', cell });
    }
  };
  const onUp = (e: PointerEvent<SVGSVGElement>) => {
    if (releasePointer(finger, e.pointerId)) dispatch({ type: 'END_DRAW' });
  };

  const owner = new Map<Cell, number>();
  paths.forEach((path, i) => path.forEach((cell) => owner.set(cell, i)));
  const connected = puzzle.links.map((link, i) => isConnected(paths[i], link));
  const secondsLeft = Math.ceil(state.timeLeftMs / 1000);
  const hurry = state.timeLeftMs < 10_000;
  const hint =
    state.solvedAtMs !== null
      ? `Segmented! +${roundFor(state.round).points}`
      : state.over
        ? "Time's up!"
        : connected.every(Boolean)
          ? 'Now fill every square to finish'
          : 'Drag from each device to its network';

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <Stat label="Time">
          <span className={hurry ? 'seg__time seg__time--hurry' : 'seg__time'}>{secondsLeft}s</span>
        </Stat>
      </Header>
      <main className="seg">
        <div className="seg__clock" aria-hidden="true">
          <div
            className={hurry ? 'seg__clock-fill seg__clock-fill--hurry' : 'seg__clock-fill'}
            style={{ transform: `scaleX(${state.timeLeftMs / cfg.roundMs})` }}
          />
        </div>
        <p className="seg__info">
          <strong>Network {state.round + 1}</strong>
          <span>
            {size} × {size}
          </span>
          <span className={state.solvedAtMs !== null ? 'seg__hint seg__hint--solved' : 'seg__hint'}>{hint}</span>
        </p>
        <div className="seg__body">
          <div className="seg__stage">
            <svg
              ref={svgRef}
              className={state.solvedAtMs !== null ? 'seg__board seg__board--solved' : 'seg__board'}
              viewBox={`0 0 ${size * U} ${size * U}`}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onLostPointerCapture={(e) => releasePointer(finger, e.pointerId)}
              role="img"
              aria-label={`A ${size} by ${size} grid with ${puzzle.links.length} devices to join to their networks`}
            >
              <rect className="seg-board" width={size * U} height={size * U} />
              {Array.from({ length: size * size }, (_, cell) => {
                const i = owner.get(cell);
                return (
                  <rect
                    key={cell}
                    className={i === undefined ? 'seg-cell' : 'seg-cell seg-cell--on'}
                    style={i === undefined ? undefined : colour(puzzle.links[i].kind)}
                    x={(cell % size) * U}
                    y={Math.floor(cell / size) * U}
                    width={U}
                    height={U}
                  />
                );
              })}
              {paths.map((path, i) =>
                path.length < 2 ? null : (
                  <polyline
                    key={`p${i}`}
                    className="seg-line"
                    style={colour(puzzle.links[i].kind)}
                    points={path.map((cell) => `${centre(cell).x},${centre(cell).y}`).join(' ')}
                  />
                ),
              )}
              {puzzle.links.map((link, i) =>
                link.ends.map((cell, end) => {
                  const { x, y } = centre(cell);
                  const kind = LINK_KINDS[link.kind];
                  return (
                    <g key={`e${i}-${end}`} className="seg-end" style={colour(link.kind)}>
                      <circle cx={x} cy={y} r={U * 0.4} />
                      <foreignObject x={x - U * 0.24} y={y - U * 0.24} width={U * 0.48} height={U * 0.48}>
                        <div className="seg-end__icon">
                          <Icon name={end === 0 ? kind.deviceIcon : kind.networkIcon} />
                        </div>
                      </foreignObject>
                    </g>
                  );
                }),
              )}
            </svg>
          </div>
          <ul className="seg__legend" aria-label="The links to make">
            {puzzle.links.map((link, i) => (
              <li key={i} className={connected[i] ? 'seg-key seg-key--done' : 'seg-key'}>
                <LinkChip kind={link.kind} />
                <span className="seg-key__text">
                  <span className="seg-key__name">{LINK_KINDS[link.kind].device}</span> →{' '}
                  <span className="seg-key__name">{LINK_KINDS[link.kind].network}</span>
                </span>
                {connected[i] && <Icon name="check" className="seg-key__done" />}
              </li>
            ))}
          </ul>
        </div>
        <p className="sr-only" role="status">
          {hint}
        </p>
      </main>
    </>
  );
}
