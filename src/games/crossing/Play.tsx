import { useEffect, useReducer, useRef, type CSSProperties, type PointerEvent } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import { StrikeIndicator } from '../../shell/components/StrikeIndicator';
import type { GameResult, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { CROSSING_CONFIG, type LaneType } from './config';
import { HITS } from './data';
import { columns, crossingReducer, hitLessons, initialCrossingState, type CrossingEvent, type CrossingState } from './logic';
import './crossing.css';

const cfg = CROSSING_CONFIG;
/** Each cell is CELL x CELL drawing units. */
const CELL = 100;
const COLS = columns(cfg);
const WIDTH = COLS * CELL;
const HEIGHT = cfg.rows * CELL;
const cx = (col: number) => col * CELL + CELL / 2;
const cy = (row: number) => row * CELL + CELL / 2;

/** The threats and the packet, drawn centred on (0, 0). */
function Bug() {
  return (
    <g className="cc-bug">
      <ellipse cx="0" cy="3" rx="14" ry="18" />
      <path d="M-14 -3h-11M14 -3h11M-14 9h-11M14 9h11M-12 18l-8 7M12 18l8 7M-6 -13l-7-9M6 -13l7-9" />
    </g>
  );
}

function Router({ hacked }: { hacked: boolean }) {
  return (
    <g className={hacked ? 'cc-router cc-router--hacked' : 'cc-router'}>
      <circle r="26" />
      {hacked ? <path d="M-9 -9l18 18M9 -9l-18 18" /> : <path d="M-12 0h24M0 -12v24" />}
    </g>
  );
}

function Packet() {
  return (
    <g className="cc-packet">
      <rect x="-34" y="-26" width="68" height="52" rx="8" />
      <path d="M-28 -18l28 20 28-20" />
    </g>
  );
}

/** A small picture of what hit, for the lessons page. */
function HitPicture({ kind }: { kind: LaneType }) {
  return (
    <svg className="cc-lesson" viewBox="-50 -50 100 100" aria-hidden="true">
      {kind === 'traffic' && <Bug />}
      {kind === 'ddos' && (
        <g className="cc-flood">
          {[-30, -10, 10, 30].map((y) => (
            <circle key={y} cx={y % 20 === 0 ? -8 : 8} cy={y} r="11" />
          ))}
        </g>
      )}
      {kind === 'router' && <Router hacked />}
    </svg>
  );
}

function clock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function toResult(state: CrossingState): GameResult {
  const express = state.events.filter((e) => e.type === 'delivered' && e.express).length;
  const timeUp = state.endReason === 'time';
  return {
    score: state.score,
    complete: timeUp,
    title: timeUp ? "Time's up!" : 'Connection lost!',
    reason: `You delivered ${state.delivered} ${state.delivered === 1 ? 'packet' : 'packets'}.`,
    stats: [
      { label: 'Delivered', value: String(state.delivered) },
      { label: 'Express', value: String(express) },
      { label: 'By secure route', value: String(state.deliveredSecure) },
    ],
    lessons: hitLessons(state.events).map(({ kind, count }) => ({
      outcome: 'missed',
      title: count > 1 ? `${HITS[kind].title} (${count} times)` : HITS[kind].title,
      text: HITS[kind].why,
      visual: <HitPicture kind={kind} />,
    })),
  };
}

function effectText(e: CrossingEvent): string {
  if (e.type === 'delivered') return e.express ? `+${e.points} Express!` : `+${e.points} Delivered`;
  return `Strike! ${HITS[e.kind!].name}`;
}

/**
 * Cyber Crossing: hop your data packet from your laptop to the server across attack traffic, a DDoS flood and
 * routers (some hacked). The secure route along the top is safe but slow; quick deliveries score an Express bonus.
 * A minute, or three strikes.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(crossingReducer, undefined, () =>
    initialCrossingState(Math.floor(Math.random() * 2 ** 32)),
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const packetRef = useRef(state.packet);
  packetRef.current = state.packet;
  useFrameClock(!state.over, (ms) => dispatch({ type: 'TICK', ms }));

  useEffect(() => {
    if (!state.over) return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  const move = (dx: number, dy: number) => dispatch({ type: 'MOVE', dx, dy });

  // Keyboard: the arrow keys hop. Held keys don't repeat (every hop is a decision).
  useEffect(() => {
    const keys: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || !keys[e.key]) return;
      e.preventDefault();
      dispatch({ type: 'MOVE', dx: keys[e.key][0], dy: keys[e.key][1] });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // A tap on the field hops one cell towards it (along whichever direction is further).
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (e.button !== 0 || !ctm) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const dx = Math.floor(p.x / CELL) - packetRef.current.col;
    const dy = Math.floor(p.y / CELL) - packetRef.current.row;
    if (dx === 0 && dy === 0) return;
    if (Math.abs(dx) >= Math.abs(dy)) move(Math.sign(dx), 0);
    else move(0, Math.sign(dy));
  };

  const recent = state.events.filter((e) => e.atMs + cfg.effectMs > state.timeMs);
  const hurry = state.timeLeftMs < 10_000;

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <StrikeIndicator strikes={state.strikes} max={cfg.maxStrikes} />
      </Header>
      <main className="cc">
        <div className="cc__top">
          <div className="cc__timer" aria-hidden="true">
            <div
              className={hurry ? 'cc__timer-fill cc__timer-fill--hurry' : 'cc__timer-fill'}
              style={{ transform: `scaleX(${state.timeLeftMs / cfg.roundMs})` }}
            />
          </div>
          <span className={hurry ? 'cc__clock cc__clock--hurry' : 'cc__clock'}>
            <Icon name="clock" />
            {clock(state.timeLeftMs)}
          </span>
        </div>
        <div className="cc__body">
          <div className="cc__stage">
            <svg
              ref={svgRef}
              className="cc__field"
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              style={{ '--ratio': WIDTH / HEIGHT } as CSSProperties}
              onPointerDown={onPointerDown}
              role="img"
              aria-label="A network to cross, from your laptop on the left to the server on the right"
            >
              {/* Your laptop, the lanes and the server. */}
              <rect className="cc-col cc-col--end" x="0" width={CELL} height={HEIGHT} />
              {state.lanes.map((lane, i) => (
                <g key={i}>
                  <rect className={`cc-col cc-col--${lane.type}`} x={(i + 1) * CELL} width={CELL} height={HEIGHT} />
                  {lane.type !== 'router' && <line className="cc-lane-line" x1={cx(i + 1)} x2={cx(i + 1)} y1="0" y2={HEIGHT} />}
                </g>
              ))}
              <rect className="cc-col cc-col--end" x={(COLS - 1) * CELL} width={CELL} height={HEIGHT} />
              <g transform={`translate(${cx(0)} ${HEIGHT - 60})`}>
                <path className="cc-laptop" d="M-26 -34h52v34h-52zM-36 4h72" />
                <text className="cc-end-label" y="38" textAnchor="middle">
                  YOU
                </text>
              </g>
              <g transform={`translate(${cx(COLS - 1)} ${HEIGHT - 60})`}>
                <path className="cc-laptop" d="M-24 -44h48v20h-48zM-24 -18h48v20h-48z" />
                <text className="cc-end-label" y="38" textAnchor="middle">
                  SERVER
                </text>
              </g>

              {/* Routers, and the threats. */}
              {state.lanes.map((lane, i) =>
                lane.type === 'router'
                  ? Array.from({ length: cfg.rows - 1 }, (_, r) => r + 1).map((row) => (
                      <g key={`${i}-${row}`} transform={`translate(${cx(i + 1)} ${cy(row)})`}>
                        <Router hacked={lane.hacked.includes(row)} />
                      </g>
                    ))
                  : lane.threats.map((y, t) =>
                      lane.type === 'ddos' ? (
                        // A burst of junk packets: three dots, so the lane looks like the flood it is.
                        <g key={`${i}-${t}`} className="cc-flood" transform={`translate(${cx(i + 1)} ${y * CELL + CELL / 2})`}>
                          <circle cx="-16" cy="-8" r="11" />
                          <circle cx="16" cy="-12" r="11" />
                          <circle cx="0" cy="12" r="11" />
                        </g>
                      ) : (
                        <g key={`${i}-${t}`} transform={`translate(${cx(i + 1)} ${y * CELL + CELL / 2}) scale(1 ${-lane.dir})`}>
                          <Bug />
                        </g>
                      ),
                    ),
              )}
              {state.lanes.map((lane, i) =>
                lane.type === 'ddos' ? (
                  <text key={i} className="cc-ddos-label" x={cx(i + 1)} y={HEIGHT - 16} textAnchor="middle">
                    DDoS
                  </text>
                ) : null,
              )}

              {/* The secure route along the top: threats pass under it. */}
              <g className="cc-secure">
                <rect x={CELL} y="6" width={(COLS - 2) * CELL} height={CELL - 12} rx="18" />
                <text x={WIDTH / 2} y={CELL / 2 + 9} textAnchor="middle">
                  SECURE ROUTE · encrypted + filtered · slower
                </text>
              </g>

              <g className="cc-packet-pos" style={{ transform: `translate(${cx(state.packet.col)}px, ${cy(state.packet.row)}px)` }}>
                <Packet />
              </g>

              {recent.map((e) => (
                <text
                  key={`${e.atMs}-${e.type}`}
                  className={`cc-effect cc-effect--${e.type}`}
                  x={e.type === 'delivered' ? WIDTH - CELL * 2.2 : Math.min(Math.max(cx(e.col), 200), WIDTH - 200)}
                  y={Math.max(cy(e.row) - 40, CELL + 50)}
                  textAnchor="middle"
                >
                  {effectText(e)}
                </text>
              ))}
            </svg>
          </div>
          <aside className="cc__panel">
            <p className="cc__delivered">
              <span className="cc__delivered-n">{state.delivered}</span> delivered
            </p>
            <div className="cc-pad" aria-label="Hop">
              <button type="button" className="cc-pad__btn cc-pad__btn--up" aria-label="Up" onClick={() => move(0, -1)}>
                <Icon name="arrow-right" className="icon--up" />
              </button>
              <button type="button" className="cc-pad__btn cc-pad__btn--left" aria-label="Back" onClick={() => move(-1, 0)}>
                <Icon name="arrow-right" className="icon--left" />
              </button>
              <button type="button" className="cc-pad__btn cc-pad__btn--right" aria-label="Forward" onClick={() => move(1, 0)}>
                <Icon name="arrow-right" />
              </button>
              <button type="button" className="cc-pad__btn cc-pad__btn--down" aria-label="Down" onClick={() => move(0, 1)}>
                <Icon name="arrow-right" className="icon--down" />
              </button>
            </div>
            <ul className="cc__legend">
              <li>
                <svg viewBox="-35 -35 70 70" aria-hidden="true">
                  <Bug />
                </svg>
                Attack traffic
              </li>
              <li>
                <svg viewBox="-35 -35 70 70" aria-hidden="true">
                  <circle className="cc-flood-dot" cx="-8" cy="-10" r="12" />
                  <circle className="cc-flood-dot" cx="8" cy="12" r="12" />
                </svg>
                DDoS flood
              </li>
              <li>
                <svg viewBox="-35 -35 70 70" aria-hidden="true">
                  <Router hacked />
                </svg>
                Hacked router
              </li>
              <li>
                <Icon name="lock" /> Secure route: safe, slow
              </li>
            </ul>
          </aside>
        </div>
        <p className="sr-only" role="status">
          {recent.length > 0 ? effectText(recent[recent.length - 1]) : ''}
        </p>
      </main>
    </>
  );
}
