import { useEffect, useReducer, useRef, type CSSProperties, type PointerEvent } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import { StrikeIndicator } from '../../shell/components/StrikeIndicator';
import type { GameResult, PlayProps } from '../../shell/types';
import { claimPointer, ownsPointer, releasePointer } from '../../shell/primaryPointer';
import { useFrameClock } from '../../shell/useFrameClock';
import { CLAW_CONFIG } from './config';
import { ITEMS } from './data';
import { ItemArt } from './ItemArt';
import {
  clampX,
  clawReducer,
  clawPos,
  initialClawState,
  mistakeLessons,
  slotX,
  type ClawState,
  type Item,
  type Outcome,
} from './logic';
import './claw.css';

const cfg = CLAW_CONFIG;
const { box } = cfg;

/** An item with its label under it, as it sits in the machine. */
function ItemInMachine({ kind }: { kind: number }) {
  return (
    <>
      <ItemArt id={ITEMS[kind].id} />
      <text className="cm-label" y="64" textAnchor="middle">
        {ITEMS[kind].label}
      </text>
    </>
  );
}

/** Where an item is drawn: resting in its slot, or still falling into it. */
function itemY(item: Item, timeMs: number): number {
  const t = Math.min(1, Math.max(0, (timeMs - item.fallStartMs) / cfg.fallMs));
  return item.fallFromY + (box.itemY - item.fallFromY) * t * t;
}

function clock(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function toResult(state: ClawState): GameResult {
  const count = (type: Outcome['type']) => state.outcomes.filter((o) => o.type === type).length;
  const keysAndCerts = state.outcomes.filter((o) => o.type === 'good' && ['key', 'cert'].includes(ITEMS[o.kind].id)).length;
  const timeUp = state.endReason === 'time';
  return {
    score: state.score,
    complete: timeUp,
    title: timeUp ? "Time's up!" : 'Reinfected!',
    reason: timeUp
      ? `You recovered ${count('good')} ${count('good') === 1 ? 'item' : 'items'}.`
      : `${cfg.maxStrikes} bad restores reinfected the system.`,
    stats: [
      { label: 'Recovered', value: String(count('good')) },
      { label: 'Keys & certificates', value: String(keysAndCerts) },
      { label: 'Bad restores', value: String(count('strike') + count('dud')) },
    ],
    lessons: mistakeLessons(state.outcomes).map(({ kind, count: n }) => ({
      outcome: 'missed',
      title: n > 1 ? `You restored: ${kind.name} (${n} times)` : `You restored: ${kind.name}`,
      text: kind.why,
      visual: (
        <svg className="claw-lesson-item" viewBox="-60 -50 120 130" aria-hidden="true">
          <ItemInMachine kind={ITEMS.indexOf(kind)} />
        </svg>
      ),
    })),
  };
}

/** The message by the chute after a restore, or where the claw is after a slip. */
function effectText(o: Outcome): string {
  const kind = ITEMS[o.kind];
  switch (o.type) {
    case 'good':
      return `+${o.points} ${kind.label}`;
    case 'strike':
      return `Strike! ${kind.name}`;
    case 'dud':
      return 'Corrupted: useless';
    case 'slip':
      return 'It slipped!';
  }
}

/**
 * Data Recovery Claw: a claw machine full of what's left of a compromised system. Steer the claw, drop it, and
 * restore the good things (backups, keys, certificates) through the chute. Restoring malware, an infected backup or
 * locked files is a strike. The round lasts a minute, or three strikes.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(clawReducer, undefined, () =>
    initialClawState(Math.floor(Math.random() * 2 ** 32)),
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const finger = useRef<number | null>(null);
  useFrameClock(!state.over, (ms) => dispatch({ type: 'TICK', ms }));

  useEffect(() => {
    if (!state.over) return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  // Keyboard: hold ← or → to steer, and let go to drop; Space, Enter or ↓ drops where it is.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowLeft') dispatch({ type: 'AIM', x: 0 });
      else if (e.key === 'ArrowRight') dispatch({ type: 'AIM', x: box.width });
      else if (!e.repeat && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown')) {
        e.preventDefault();
        dispatch({ type: 'DROP' });
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') dispatch({ type: 'DROP' });
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Hold a finger on the machine to steer (the trolley heads for it, with momentum); let go and the claw drops.
  const steer = (e: PointerEvent<SVGSVGElement>) => {
    if (e.type === 'pointermove' && e.buttons === 0) return;
    if (e.type === 'pointerdown' ? !claimPointer(finger, e.pointerId) : !ownsPointer(finger, e.pointerId)) return;
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return;
    if (e.type === 'pointerdown') svgRef.current?.setPointerCapture(e.pointerId);
    dispatch({ type: 'AIM', x: new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()).x });
  };
  const letGo = (e: PointerEvent<SVGSVGElement>) => {
    if (releasePointer(finger, e.pointerId)) dispatch({ type: 'DROP' });
  };
  const letGoButton = () => dispatch({ type: 'DROP' });
  // The arrow buttons work the same way: hold to move, let go to drop.
  const hold = (x: number) => ({
    onPointerDown: () => dispatch({ type: 'AIM', x }),
    onPointerUp: letGoButton,
    onPointerLeave: (e: PointerEvent) => {
      if (e.buttons) letGoButton();
    },
    onPointerCancel: letGoButton,
  });

  const { phase, timeMs, trolleyX } = state;
  const claw = clawPos(state);
  const tilt = (-state.angle * 180) / Math.PI;
  const held = state.items.find((i) => i.id === state.held);
  const open = phase === 'aim' || phase === 'down' || phase === 'release' || (phase === 'up' && !held);
  const recent = state.outcomes.filter((o) => o.atMs + cfg.effectMs > timeMs);
  const hurry = state.timeLeftMs < 10_000;

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <StrikeIndicator strikes={state.strikes} max={cfg.maxStrikes} />
      </Header>
      <main className="claw">
        <div className="claw__top">
          <div className="claw__timer" aria-hidden="true">
            <div
              className={hurry ? 'claw__timer-fill claw__timer-fill--hurry' : 'claw__timer-fill'}
              style={{ transform: `scaleX(${state.timeLeftMs / cfg.roundMs})` }}
            />
          </div>
          <span className={hurry ? 'claw__clock claw__clock--hurry' : 'claw__clock'}>
            <Icon name="clock" />
            {clock(state.timeLeftMs)}
          </span>
        </div>
        <div className="claw__stage">
          <svg
            ref={svgRef}
            className="claw__machine"
            viewBox={`0 0 ${box.width} ${box.height}`}
            style={{ '--ratio': box.width / box.height } as CSSProperties}
            onPointerDown={steer}
            onPointerMove={steer}
            onPointerUp={letGo}
            onPointerCancel={letGo}
            onLostPointerCapture={(e) => releasePointer(finger, e.pointerId)}
            role="img"
            aria-label="A claw machine full of backups, keys, certificates and malware"
          >
            <rect className="cm-glass" width={box.width} height={box.height} />
            <rect className="cm-floor" y={box.itemY + box.itemSize / 2 + 8} width={box.width} height={box.height} />
            {/* The chute: what goes down here is restored. */}
            <rect className="cm-chute" x={box.chuteX - 62} y={box.itemY - 40} width="124" height={box.height} rx="8" />
            <text className="cm-chute-label" x={box.chuteX} y={box.itemY + 10} textAnchor="middle">
              RESTORE
            </text>
            <path
              className="cm-chute-arrow"
              d={`M${box.chuteX} ${box.itemY - 110}v44m-16 -16l16 16 16 -16`}
            />
            {/* A plumb line straight down from the trolley: where the claw would land if it weren't swinging. */}
            {(phase === 'aim' || phase === 'idle') && (
              <line className="cm-aim" x1={trolleyX} y1={box.railY + 20} x2={trolleyX} y2={box.itemY + box.itemSize / 2} />
            )}
            {state.items
              .filter((item) => item !== held)
              .map((item) => (
                <g key={item.id} transform={`translate(${slotX(item.slot)} ${itemY(item, timeMs)})`}>
                  <ItemInMachine kind={item.kind} />
                </g>
              ))}
            {/* The rail, the trolley, the cable and the claw, swinging on it. */}
            <rect className="cm-rail" x="0" y={box.railY - 12} width={box.width} height="24" />
            <rect className="cm-carriage" x={trolleyX - 44} y={box.railY - 18} width="88" height="36" rx="8" />
            <line className="cm-cable" x1={trolleyX} y1={box.railY} x2={claw.x} y2={claw.y} />
            {held && (
              <g transform={`translate(${claw.x} ${claw.y + 40})`}>
                <ItemInMachine kind={held.kind} />
              </g>
            )}
            <g transform={`translate(${claw.x} ${claw.y}) rotate(${tilt})`}>
              <rect className="cm-claw-head" x="-26" y="-36" width="52" height="24" rx="6" />
              <path
                className="cm-claw-arm"
                d={open ? 'M-18 -14l-34 30 8 34M18 -14l34 30 -8 34' : 'M-18 -14l-22 26 12 34M18 -14l22 26 -12 34'}
              />
            </g>
            {recent.map((o) => (
              <text
                key={`${o.atMs}-${o.type}`}
                className={`cm-effect cm-effect--${o.type}`}
                x={o.type === 'slip' ? clampX(claw.x + 150) : box.chuteX + 20}
                y={o.type === 'slip' ? box.itemY - 190 : box.itemY - 150}
                textAnchor={o.type === 'slip' ? 'middle' : 'start'}
              >
                {effectText(o)}
              </text>
            ))}
          </svg>
        </div>
        <div className="claw__controls">
          <button type="button" className="claw-btn" aria-label="Move left" {...hold(0)}>
            <Icon name="arrow-right" className="icon--flip" />
          </button>
          <p className="claw__how">
            <strong>Hold</strong> to move · <strong>let go</strong> to drop
          </p>
          <button type="button" className="claw-btn" aria-label="Move right" {...hold(box.width)}>
            <Icon name="arrow-right" />
          </button>
        </div>
        <p className="sr-only" role="status">
          {recent.length > 0 ? effectText(recent[recent.length - 1]) : ''}
        </p>
      </main>
    </>
  );
}
