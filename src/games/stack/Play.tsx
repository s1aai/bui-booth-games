import { useEffect, useReducer, useRef, type CSSProperties } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import { StrikeIndicator } from '../../shell/components/StrikeIndicator';
import type { GameResult, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { STACK_CONFIG } from './config';
import { BLOCKS } from './data';
import { exposures, initialStackState, stackReducer, top, type StackEvent, type StackState } from './logic';
import './stack.css';

const cfg = STACK_CONFIG;
const { view } = cfg;
/** Where the foundation's bottom edge sits, in drawing units. */
const GROUND = view.height - 30;
const levelY = (level: number) => GROUND - (level + 1) * view.blockHeight;

/** A small picture for each kind of block, centred on (0, 0), about 36 units tall. */
function Glyph({ kind }: { kind: number }) {
  switch (BLOCKS[kind]?.id) {
    case 'database':
      return (
        <g className="sb-glyph">
          <ellipse cx="0" cy="-12" rx="14" ry="6" />
          <path d="M-14 -12v24c0 3.3 6.3 6 14 6s14-2.7 14-6v-24M-14 0c0 3.3 6.3 6 14 6s14-2.7 14-6" />
        </g>
      );
    case 'web':
      return (
        <g className="sb-glyph">
          <rect x="-16" y="-17" width="32" height="14" rx="3" />
          <rect x="-16" y="2" width="32" height="14" rx="3" />
          <path d="M-9 -10h.01M-9 9h.01" />
        </g>
      );
    case 'firewall':
      return (
        <g className="sb-glyph">
          <path d="M0 -18l14 6v8c0 9-6 15-14 18-8-3-14-9-14-18v-8z" />
        </g>
      );
    case 'login':
      return (
        <g className="sb-glyph">
          <rect x="-12" y="-3" width="24" height="18" rx="3" />
          <path d="M-7 -3v-6a7 7 0 0 1 14 0v6" />
        </g>
      );
    default:
      return null;
  }
}

/** A block of the tower (or the sliding one), drawn at its level. */
function BlockShape({ kind, x, width, y, exposed = false }: { kind: number; x: number; width: number; y: number; exposed?: boolean }) {
  const id = kind < 0 ? 'foundation' : BLOCKS[kind].id;
  const label = kind < 0 ? 'Your company' : BLOCKS[kind].label;
  const h = view.blockHeight - 4;
  const cx = x + width / 2;
  const showLabel = width >= 190;
  const showGlyph = width >= 56 && kind >= 0;
  // The picture and the label, centred together: about 13.5 units a character at this size.
  const start = cx - (34 + 12 + label.length * 13.5) / 2;
  return (
    <g className={exposed ? `sb-block sb-block--${id} sb-block--exposed` : `sb-block sb-block--${id}`}>
      <rect x={x} y={y} width={width} height={h} rx="8" />
      {id === 'firewall' && (
        <path
          className="sb-bricks"
          d={`M${x} ${y + h / 2}h${width}${Array.from({ length: Math.floor(width / 40) }, (_, i) => `M${x + 20 + i * 40} ${y}v${h / 2}M${x + 40 + i * 40} ${y + h / 2}v${h / 2}`).join('')}`}
        />
      )}
      {showGlyph && (
        <g transform={`translate(${showLabel ? start + 17 : cx} ${y + h / 2})`}>
          <Glyph kind={kind} />
        </g>
      )}
      {(showLabel || kind < 0) && width >= 120 && (
        <text
          className="sb-label"
          x={showGlyph ? start + 46 : cx}
          y={y + h / 2 + 8}
          textAnchor={showGlyph ? 'start' : 'middle'}
        >
          {label}
        </text>
      )}
      {exposed && (
        <g transform={`translate(${x + width - 20} ${y + 10})`}>
          <circle className="sb-alert" r="15" />
          <path className="sb-alert-mark" d="M0 -7v7M0 6h.01" />
        </g>
      )}
    </g>
  );
}

function effectText(e: StackEvent): string {
  switch (e.type) {
    case 'perfect':
      return `Perfect! +${e.points}`;
    case 'protected':
      return `Protected +${e.points}`;
    case 'depth':
      return `Defence in depth +${e.points}`;
    case 'exposed':
      return 'Exposed! Strike';
    case 'collapse':
      return 'Collapsed!';
  }
}

function toResult(state: StackState): GameResult {
  const height = state.blocks.length - 1;
  const count = (type: StackEvent['type']) => state.events.filter((e) => e.type === type).length;
  return {
    score: state.score,
    complete: false,
    title: state.endReason === 'strikes' ? 'Breached!' : 'Collapsed!',
    reason: `Your tower reached ${height} ${height === 1 ? 'block' : 'blocks'}.`,
    stats: [
      { label: 'Height', value: String(height) },
      { label: 'Protected', value: String(count('protected') + count('depth')) },
      { label: 'Exposed', value: String(count('exposed')) },
    ],
    lessons: exposures(state.events).map((e) => ({
      outcome: 'missed',
      title: `${BLOCKS[e.kind].label} straight on a Database`,
      text: 'Nothing stood between your data and the internet. Put a Firewall or Login + MFA on a database before anything else.',
      visual: (
        <svg className="sb-lesson" viewBox={`0 ${-2 * view.blockHeight - 8} 320 ${2 * view.blockHeight + 16}`} aria-hidden="true">
          <BlockShape kind={e.below} x={10} width={300} y={-view.blockHeight} exposed />
          <BlockShape kind={e.kind} x={10} width={300} y={-2 * view.blockHeight} />
        </svg>
      ),
    })),
  };
}

/**
 * Secure Stack: build a tower of infrastructure. Pick one of two blocks, then drop it as it slides: overhang is
 * sliced off, and missing collapses the tower. A database needs a Firewall or Login on it, or it's exposed (a
 * strike); protection and defence in depth score bonuses. Three strikes, or a collapse, end the game.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(stackReducer, undefined, () =>
    initialStackState(Math.floor(Math.random() * 2 ** 32)),
  );
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;
  useFrameClock(state.phase !== 'over', (ms) => dispatch({ type: 'TICK', ms }));

  useEffect(() => {
    if (state.phase !== 'over') return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  // Keyboard: 1 and 2 (or ← and →) pick; Space, Enter or ↓ drops.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (phaseRef.current === 'pick' && (e.key === '1' || e.key === 'ArrowLeft')) dispatch({ type: 'PICK', option: 0 });
      else if (phaseRef.current === 'pick' && (e.key === '2' || e.key === 'ArrowRight')) dispatch({ type: 'PICK', option: 1 });
      else if (phaseRef.current === 'slide' && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown')) {
        e.preventDefault();
        dispatch({ type: 'DROP' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const level = state.blocks.length;
  // Scroll up as the tower grows, keeping the sliding block in view below the internet band.
  const scroll = Math.max(0, (level - view.visibleBlocks) * view.blockHeight);
  const below = top(state);
  const needsCover = below.kind >= 0 && BLOCKS[below.kind].role === 'data';
  // Only the latest drop's messages, and only while its block is still the top one, so an older one never sits on top
  // of the block placed since (a drop that scores nothing has no messages of its own to replace it).
  const lastAt = state.events.at(-1)?.atMs ?? -Infinity;
  const recent = state.events.filter(
    (e) => e.atMs === lastAt && e.level >= level - 1 && e.atMs + cfg.effectMs > state.timeMs,
  );
  const fall = state.cut ? (state.timeMs - state.cut.atMs) / cfg.effectMs : 1;

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <StrikeIndicator strikes={state.strikes} max={cfg.maxStrikes} />
      </Header>
      <main className="sb">
        <div className="sb__stage">
          <svg
            className="sb__view"
            viewBox={`0 0 ${view.width} ${view.height}`}
            style={{ '--ratio': view.width / view.height } as CSSProperties}
            onPointerDown={(e) => {
              if (e.button === 0 && state.phase === 'slide') dispatch({ type: 'DROP' });
            }}
            role="img"
            aria-label={`A tower of ${level - 1} blocks`}
          >
            <rect className="sb-sky" width={view.width} height={view.height} />
            <g className="sb-world" style={{ transform: `translateY(${scroll}px)` }}>
              {state.blocks.map((b, i) => (
                <BlockShape key={i} kind={b.kind} x={b.x} width={b.width} y={levelY(i)} exposed={b.exposed} />
              ))}
              {state.sliding && <BlockShape kind={state.sliding.kind} x={state.sliding.x} width={below.width} y={levelY(level)} />}
              {state.cut && fall < 1 && (
                <g style={{ opacity: 1 - fall }}>
                  <BlockShape
                    kind={state.cut.kind}
                    x={state.cut.x}
                    width={state.cut.width}
                    y={levelY(state.cut.level) + 900 * fall * fall}
                  />
                </g>
              )}
              {recent.map((e, i) => (
                <text
                  key={`${e.atMs}-${e.type}`}
                  className={`sb-effect sb-effect--${e.type}`}
                  x={view.width / 2}
                  y={levelY(e.level) - 18 - i * 44}
                  textAnchor="middle"
                >
                  {effectText(e)}
                </text>
              ))}
            </g>
            {/* The internet, where attackers come from: always at the top. */}
            <rect className="sb-internet" width={view.width} height="64" />
            <text className="sb-internet__label" x={view.width / 2} y="42" textAnchor="middle">
              THE INTERNET
            </text>
          </svg>
        </div>
        <aside className="sb__panel">
          {state.phase === 'pick' && (
            <>
              <h2 className={needsCover ? 'sb__prompt sb__prompt--warn' : 'sb__prompt'}>
                {needsCover ? 'Cover that database!' : 'Pick your next block'}
              </h2>
              <div className="sb__options">
                {state.options.map((kind, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`sb-option sb-option--${BLOCKS[kind].id}`}
                    onClick={() => dispatch({ type: 'PICK', option: i as 0 | 1 })}
                    autoFocus={i === 0}
                  >
                    <svg className="sb-option__glyph" viewBox="-24 -24 48 48" aria-hidden="true">
                      <Glyph kind={kind} />
                    </svg>
                    <span className="sb-option__label">{BLOCKS[kind].label}</span>
                    <span className="sb-option__points">{BLOCKS[kind].points} pts</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {state.phase === 'slide' && (
            <>
              <h2 className="sb__prompt">Line it up…</h2>
              <button
                type="button"
                className="btn btn--primary sb__drop"
                onPointerDown={(e) => {
                  // On press, not release, like a tap on the tower: timing is the game. Keyboard and screen readers use onClick.
                  if (e.button === 0) dispatch({ type: 'DROP' });
                }}
                onClick={(e) => {
                  if (e.detail === 0) dispatch({ type: 'DROP' });
                }}
              >
                Drop
              </button>
            </>
          )}
          {state.phase === 'over' && <h2 className="sb__prompt sb__prompt--warn">{state.endReason === 'strikes' ? 'Breached!' : 'Collapsed!'}</h2>}
          <ul className="sb__rules">
            <li>
              <Icon name="database" /> Cover a Database with a Firewall or Login, or it's exposed.
            </li>
            <li>
              <Icon name="shield" /> Firewall + Login together: defence in depth.
            </li>
          </ul>
        </aside>
        <p className="sr-only" role="status">
          {recent.length > 0 ? effectText(recent[recent.length - 1]) : ''}
        </p>
      </main>
    </>
  );
}
