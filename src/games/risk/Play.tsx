import { useEffect, useReducer, useRef, useState, type PointerEvent } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import type { GameResult, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { RISK_CONFIG } from './config';
import { createRiskReducer, initialRiskState, riskScore, type RiskState } from './logic';
import { SCENE_ART } from './sceneArt';
import { OFFICE, type Hotspot } from './scenes';
import './risk.css';

const cfg = RISK_CONFIG;
const scene = OFFICE;
const Art = SCENE_ART[scene.id];
const riskReducer = createRiskReducer(scene, cfg);

/** A ring around a risk plus a tick (found) or cross (missed) badge: shape as well as colour. */
function Marker({ spot, found }: { spot: Hotspot; found: boolean }) {
  const bx = spot.x + spot.r * 0.7;
  const by = spot.y - spot.r * 0.7;
  return (
    <g className={found ? 'risk-mark risk-mark--found' : 'risk-mark risk-mark--missed'}>
      <circle className="risk-mark__ring" cx={spot.x} cy={spot.y} r={spot.r} />
      <circle className="risk-mark__badge" cx={bx} cy={by} r="24" />
      <path
        className="risk-mark__icon"
        d={found ? `M${bx - 11} ${by + 1}l7 8 15-16` : `M${bx - 9} ${by - 9}l18 18M${bx + 9} ${by - 9}l-18 18`}
      />
    </g>
  );
}

/** A close-up of one risk in the scene, for the lessons page. */
function Closeup({ spot, found }: { spot: Hotspot; found: boolean }) {
  const w = Math.max(spot.r * 3.4, 360);
  const h = w * 0.6;
  const x = Math.min(Math.max(spot.x - w / 2, 0), scene.width - w);
  const y = Math.min(Math.max(spot.y - h / 2, 0), scene.height - h);
  return (
    <svg className="risk-closeup" viewBox={`${x} ${y} ${w} ${h}`} aria-hidden="true">
      <Art />
      <Marker spot={spot} found={found} />
    </svg>
  );
}

function clock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function toResult(state: RiskState): GameResult {
  const allFound = state.endReason === 'all-found';
  const secondsLeft = Math.floor(state.timeLeftMs / 1000);
  const total = scene.hotspots.length;
  const isFound = (spot: Hotspot) => state.found.includes(spot.id);
  // Missed risks first: they're the lessons that matter most.
  const ordered = [...scene.hotspots.filter((spot) => !isFound(spot)), ...scene.hotspots.filter(isFound)];
  return {
    score: riskScore(state, cfg),
    complete: allFound,
    title: allFound ? 'All risks found!' : "Time's up!",
    reason: allFound ? `With ${secondsLeft} seconds to spare.` : `You found ${state.found.length} of ${total}.`,
    stats: [
      { label: 'Found', value: `${state.found.length} / ${total}` },
      { label: 'Wrong taps', value: String(state.misses.length) },
      { label: 'Time bonus', value: allFound ? `+${secondsLeft * cfg.timeBonusPerSecond}` : '0' },
    ],
    lessons: ordered.map((spot) => ({
      outcome: isFound(spot) ? 'found' : 'missed',
      title: spot.label,
      text: spot.tip,
      visual: <Closeup spot={spot} found={isFound(spot)} />,
    })),
  };
}

/**
 * Spot the Risk: tap the security slip-ups hidden in the office before the time runs out. A tap on anything else
 * costs cfg.missPenaltyMs. When the round ends, the risks still hidden are ringed for a moment, then the lessons.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(riskReducer, undefined, () => initialRiskState(cfg));
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<Hotspot | null>(null);
  const [missMark, setMissMark] = useState<{ x: number; y: number; n: number } | null>(null);

  // The clock follows the screen's frames.
  useFrameClock(!state.over, (ms) => dispatch({ type: 'TICK', ms }));

  useEffect(() => {
    if (!state.over) return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  // The latest risk found shows its tip for a while.
  const lastFound = state.found.at(-1);
  useEffect(() => {
    if (!lastFound) return;
    setTip(scene.hotspots.find((spot) => spot.id === lastFound) ?? null);
    const id = window.setTimeout(() => setTip(null), cfg.tipMs);
    return () => window.clearTimeout(id);
  }, [lastFound]);

  // A wrong tap shows "−3s" where it landed for a moment.
  const lastMiss = state.misses.at(-1);
  useEffect(() => {
    if (!lastMiss) return;
    setMissMark({ ...lastMiss, n: state.misses.length });
    const id = window.setTimeout(() => setMissMark(null), cfg.missMarkMs);
    return () => window.clearTimeout(id);
  }, [lastMiss, state.misses.length]);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (state.over || e.button !== 0 || !ctm) return;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    dispatch({ type: 'TAP', x: point.x, y: point.y });
  };

  const hurry = state.timeLeftMs < cfg.hurryMs;
  const shown = scene.hotspots.filter((spot) => state.over || state.found.includes(spot.id));

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Found">
          {state.found.length} / {scene.hotspots.length}
        </Stat>
        <Stat label="Time">
          <span className={hurry ? 'risk__time risk__time--hurry' : 'risk__time'}>{clock(state.timeLeftMs)}</span>
        </Stat>
      </Header>
      <main className="risk">
        <div className="risk__timer" aria-hidden="true">
          <div
            className={hurry ? 'risk__timer-fill risk__timer-fill--hurry' : 'risk__timer-fill'}
            style={{ transform: `scaleX(${state.timeLeftMs / cfg.roundMs})` }}
          />
        </div>
        <div className="risk__stage">
          <svg
            ref={svgRef}
            className="risk__scene"
            viewBox={`0 0 ${scene.width} ${scene.height}`}
            onPointerDown={onPointerDown}
            role="img"
            aria-label="An office. Tap every security risk you can see."
          >
            <Art />
            {shown.map((spot) => (
              <Marker key={spot.id} spot={spot} found={state.found.includes(spot.id)} />
            ))}
            {missMark && (
              <g key={missMark.n} className="risk-miss" transform={`translate(${missMark.x} ${missMark.y})`}>
                <circle className="risk-miss__bg" r="26" />
                <path className="risk-miss__icon" d="M-10 -10l20 20M10 -10l-20 20" />
                <text className="risk-miss__text" y="-38" textAnchor="middle">
                  −{cfg.missPenaltyMs / 1000}s
                </text>
              </g>
            )}
          </svg>
          {state.over && (
            <p className="risk__over" role="status">
              {state.endReason === 'all-found' ? 'All found!' : "Time's up!"}
            </p>
          )}
        </div>
        {/* Under the scene, not over it, so a tip never hides a risk that's still to find. */}
        <p className={tip ? 'risk__tipbar risk__tipbar--found' : 'risk__tipbar'} role="status">
          {tip ? (
            <span key={tip.id} className="risk__tip">
              <Icon name="check" />
              <span>
                <strong>{tip.label}.</strong> {tip.tip}
              </span>
            </span>
          ) : (
            'Tap anything that looks like a security risk.'
          )}
        </p>
      </main>
    </>
  );
}
