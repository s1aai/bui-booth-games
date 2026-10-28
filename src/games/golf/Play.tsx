import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import type { GameResult, Lesson, PlayProps } from '../../shell/types';
import { claimPointer, ownsPointer, releasePointer } from '../../shell/primaryPointer';
import { useFrameClock } from '../../shell/useFrameClock';
import { GOLF_CONFIG } from './config';
import { makeCourse } from './course';
import { HOLES, type Hole } from './data';
import { createGolfReducer, initialGolfState, type GolfEvent, type GolfState } from './logic';
import { validateHoles } from './validate';
import './golf.css';

const cfg = GOLF_CONFIG;

function effectText(e: GolfEvent): string {
  switch (e.type) {
    case 'intercepted':
      return 'Intercepted! +1 stroke';
    case 'tunnel':
      return 'Encrypted!';
    case 'sunk':
      return e.strokes === 1 ? `Hole in one! +${e.points}` : `In! +${e.points}`;
    case 'gaveUp':
      return 'Out of strokes';
  }
}

function toResult(state: GolfState, course: readonly Hole[]): GameResult {
  const strokes = state.card.reduce((a, b) => a + b, 0);
  const par = course.reduce((a, h) => a + h.par, 0);
  const intercepted = state.events.filter((e) => e.type === 'intercepted').length;
  const tunnelled = state.events.some((e) => e.type === 'tunnel');
  const lessons: Lesson[] = [];
  if (intercepted > 0) {
    lessons.push({
      outcome: 'missed',
      title: `Intercepted by a packet sniffer${intercepted > 1 ? ` (${intercepted} times)` : ''}`,
      text: "On networks you don't control, like public Wi-Fi, unencrypted traffic can be read. Use HTTPS and a VPN.",
    });
  }
  if (tunnelled) {
    lessons.push({
      outcome: 'found',
      title: 'Through the VPN tunnel',
      text: 'An encrypted tunnel carries your traffic safely past eavesdroppers on the way.',
    });
  }
  lessons.push({
    outcome: 'found',
    title: 'Through the firewall ports',
    text: 'A firewall blocks everything except the openings (ports) you choose. Keep as few open as you can.',
  });
  return {
    score: state.score,
    complete: true,
    title: 'Course complete!',
    reason: `${strokes} strokes, par ${par}.`,
    stats: [
      { label: 'Strokes', value: String(strokes) },
      { label: 'Par', value: String(par) },
      { label: 'Intercepted', value: String(intercepted) },
    ],
    lessons,
  };
}

/**
 * Network Golf: putt your data packet to the server in as few strokes as you can. Firewalls only let it through
 * their open port, packet-sniffer zones intercept it (a penalty stroke), and VPN tunnels carry it safely past them.
 * Three holes, on a new course each game.
 */
export function Play({ onFinish }: PlayProps) {
  const [course] = useState(() => {
    const made = makeCourse(Math.floor(Math.random() * 2 ** 32));
    return validateHoles(made).length === 0 ? made : HOLES;
  });
  const reducer = useMemo(() => createGolfReducer(cfg, course), [course]);
  const [state, dispatch] = useReducer(reducer, course, initialGolfState);
  const svgRef = useRef<SVGSVGElement>(null);
  const finger = useRef<number | null>(null);
  /**
   * Pulling back to aim, like a slingshot: the ball goes away from the finger, harder the further it is from the
   * ball. `moved` is false until the finger moves, so a tap doesn't putt.
   */
  const [drag, setDrag] = useState<{ x0: number; y0: number; moved: boolean; angle: number; power: number } | null>(null);
  useFrameClock(!state.over, (ms) => dispatch({ type: 'TICK', ms }));

  useEffect(() => {
    if (!state.over) return;
    const id = window.setTimeout(() => onFinish(toResult(state, course)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, course, onFinish]);

  const ready = !state.moving && state.sunkAtMs === null;
  const hole = course[state.hole];

  // Keyboard: ← → aim, ↑ ↓ power, Space shoots. Starts aimed at the hole.
  // `used`: the keys have been used, so their pull band shows too (until then, only the direction line does).
  const [keyAim, setKeyAim] = useState({ angle: 0, power: 0.5, used: false });
  useEffect(() => {
    setKeyAim((a) => ({ ...a, angle: Math.atan2(hole.hole.y - hole.start.y, hole.hole.x - hole.start.x), power: 0.5 }));
  }, [hole]);
  const keyRef = useRef({ keyAim, ready });
  keyRef.current = { keyAim, ready };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const step = { ArrowLeft: [-0.08, 0], ArrowRight: [0.08, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
      if (step) {
        e.preventDefault();
        setKeyAim((a) => ({ angle: a.angle + step[0], power: Math.min(1, Math.max(0.05, a.power + step[1])), used: true }));
      } else if (!e.repeat && e.key === ' ' && keyRef.current.ready) {
        e.preventDefault();
        const { angle, power } = keyRef.current.keyAim;
        dispatch({ type: 'SHOOT', angle, power });
        setKeyAim((a) => ({ ...a, used: true }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toScene = (e: PointerEvent) => {
    const ctm = svgRef.current?.getScreenCTM();
    return ctm ? new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()) : null;
  };
  const { ball } = state;
  const pull = (p: DOMPoint) => ({
    angle: Math.atan2(ball.y - p.y, ball.x - p.x),
    power: Math.min(1, Math.hypot(ball.x - p.x, ball.y - p.y) / cfg.maxDrag),
  });
  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const p = toScene(e);
    if (!ready || !p || e.button !== 0 || !claimPointer(finger, e.pointerId)) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag({ x0: p.x, y0: p.y, moved: false, ...pull(p) });
  };
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const p = toScene(e);
    if (!drag || !p || !ownsPointer(finger, e.pointerId)) return;
    setDrag({ ...drag, moved: drag.moved || Math.hypot(p.x - drag.x0, p.y - drag.y0) > 8, ...pull(p) });
  };
  const onUp = (e: PointerEvent<SVGSVGElement>) => {
    if (!releasePointer(finger, e.pointerId)) return;
    if (drag?.moved && drag.power > 0.04) dispatch({ type: 'SHOOT', angle: drag.angle, power: drag.power });
    setDrag(null);
  };

  const aim = drag ?? (ready ? keyAim : null);
  const recent = state.events.filter((e) => e.atMs + cfg.effectMs > state.timeMs && e.hole === state.hole);
  // The pull band runs from the ball back to the finger (for the keys, to where a finger would be).
  const pulling = drag !== null || keyAim.used;
  const dir = aim && { x: Math.cos(aim.angle), y: Math.sin(aim.angle) };
  const tip = dir && {
    x: Math.min(Math.max(ball.x + dir.x * 170, 50), cfg.width - 50),
    y: Math.min(Math.max(ball.y + dir.y * 170, 40), cfg.height - 20),
  };

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Hole">
          {state.hole + 1} / {course.length}
        </Stat>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
      </Header>
      <main className="ng">
        <p className="ng__info">
          <strong>{hole.name}</strong>
          <span>Par {hole.par}</span>
          <span>Strokes {state.strokes}</span>
          <span className="ng__hint">{ready ? 'Pull back from the ball, then let go to putt' : ' '}</span>
        </p>
        <div className="ng__stage">
          <svg
            ref={svgRef}
            className="ng__course"
            viewBox={`0 0 ${cfg.width} ${cfg.height}`}
            style={{ '--ratio': cfg.width / cfg.height } as CSSProperties}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={(e) => {
              if (releasePointer(finger, e.pointerId)) setDrag(null);
            }}
            onLostPointerCapture={(e) => releasePointer(finger, e.pointerId)}
            role="img"
            aria-label={`Hole ${state.hole + 1}: ${hole.name}`}
          >
            <rect className="ng-grass" width={cfg.width} height={cfg.height} />
            {hole.sniffers.map((s, i) => (
              <g key={`s${i}`} className="ng-sniffer">
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="16" />
                {/* The eye near the top and the name near the bottom, clear of any tunnel through the middle. */}
                <g transform={`translate(${s.x + s.w / 2} ${s.y + 56})`}>
                  <path className="ng-eye" d="M-34 0s14-20 34-20 34 20 34 20-14 20-34 20-34-20-34-20z" />
                  <circle className="ng-eye" r="8" />
                </g>
                <text x={s.x + s.w / 2} y={s.y + s.h - 28} textAnchor="middle">
                  PACKET SNIFFER
                </text>
              </g>
            ))}
            {hole.tunnels.map((t, i) => (
              <g key={`t${i}`} className="ng-tunnel">
                <line x1={t.from.x} y1={t.from.y} x2={t.to.x} y2={t.to.y} />
                <circle cx={t.from.x} cy={t.from.y} r={cfg.tunnelRadius} />
                <circle className="ng-tunnel__exit" cx={t.to.x} cy={t.to.y} r={cfg.tunnelRadius} />
                <text x={(t.from.x + t.to.x) / 2} y={t.from.y - 14} textAnchor="middle">
                  VPN TUNNEL
                </text>
                <text className="ng-tunnel__in" x={t.from.x} y={t.from.y + 7} textAnchor="middle">
                  IN
                </text>
              </g>
            ))}
            {hole.walls.map((w, i) => (
              <rect key={`w${i}`} className="ng-wall" x={w.x} y={w.y} width={w.w} height={w.h} />
            ))}
            {hole.ports.map((p, i) => {
              // Beside the gap on the start's side, just above the line a straight putt through it would take.
              const left = hole.start.x < p.x;
              return (
                <text key={`p${i}`} className="ng-port" x={left ? p.x - 34 : p.x + 34} y={p.y - 20} textAnchor={left ? 'end' : 'start'}>
                  PORT 443
                </text>
              );
            })}
            <g className="ng-hole" transform={`translate(${hole.hole.x} ${hole.hole.y})`}>
              <circle r={cfg.holeRadius} />
              <path d="M0 0v-62" />
              <path className="ng-flag" d="M0 -62l34 11-34 11z" />
              <text y={cfg.holeRadius + 26} textAnchor="middle">
                SERVER
              </text>
            </g>
            {aim && dir && tip && (
              <g style={{ '--power': aim.power } as CSSProperties}>
                <line
                  className="ng-aim"
                  x1={ball.x + dir.x * 28}
                  y1={ball.y + dir.y * 28}
                  x2={ball.x + dir.x * 130}
                  y2={ball.y + dir.y * 130}
                />
                {pulling && (
                  <>
                    <line
                      className="ng-pull"
                      x1={ball.x}
                      y1={ball.y}
                      x2={ball.x - dir.x * aim.power * cfg.maxDrag}
                      y2={ball.y - dir.y * aim.power * cfg.maxDrag}
                    />
                    <text className="ng-power" x={tip.x} y={tip.y + 9} textAnchor="middle">
                      {Math.round(aim.power * 100)}%
                    </text>
                  </>
                )}
              </g>
            )}
            {state.sunkAtMs === null && <circle className="ng-ball" cx={ball.x} cy={ball.y} r={cfg.ballRadius} />}
            {recent.map((e) => (
              <text
                key={`${e.atMs}-${e.type}`}
                className={`ng-effect ng-effect--${e.type}`}
                x={Math.min(Math.max(e.x, 170), cfg.width - 170)}
                y={Math.max(e.y - 40, 50)}
                textAnchor="middle"
              >
                {effectText(e)}
              </text>
            ))}
          </svg>
        </div>
        <p className="sr-only" role="status">
          {recent.length > 0 ? effectText(recent[recent.length - 1]) : ''}
        </p>
      </main>
    </>
  );
}
