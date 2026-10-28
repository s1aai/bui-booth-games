import { useEffect, useReducer } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import { StrikeIndicator } from '../../shell/components/StrikeIndicator';
import type { GameResult, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { PATCH_CONFIG, SEVERITIES, type Severity } from './config';
import { SERVERS, VULNERABILITIES } from './data';
import { exploitLessons, initialPatchState, patchReducer, timeLeft, type PatchState, type Vuln } from './logic';
import './patch.css';

const cfg = PATCH_CONFIG;
/** Circumference of the countdown ring (radius 44 in the 100 x 100 drawing). */
const RING = 2 * Math.PI * 44;

/** A severity label with an icon, so severities never rely on colour alone. */
function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`sev sev--${severity}`}>
      <Icon name={severity === 'low' ? 'bug' : 'alert'} />
      {cfg.severities[severity].label}
    </span>
  );
}

function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function toResult(state: PatchState): GameResult {
  const count = (list: readonly Vuln[], severity: Severity) => list.filter((v) => v.severity === severity).length;
  const criticalsPatched = count(state.patched, 'critical');
  return {
    score: state.score,
    complete: false,
    title: 'Breached!',
    reason:
      state.endReason === 'breach'
        ? 'A critical vulnerability got exploited: attackers are in.'
        : `${cfg.maxStrikes} high-severity vulnerabilities got exploited.`,
    stats: [
      { label: 'Patched', value: String(state.patched.length) },
      { label: 'Criticals patched', value: `${criticalsPatched} / ${criticalsPatched + count(state.exploited, 'critical')}` },
      { label: 'Lasted', value: clock(state.timeMs) },
    ],
    lessons: exploitLessons(state.exploited).map((lesson) => ({
      outcome: 'missed',
      title: lesson.vulnerability.name,
      text: `Exploited on ${lesson.servers.join(', ')}. ${lesson.vulnerability.why}`,
      visual: <SeverityBadge severity={lesson.severity} />,
    })),
  };
}

/** One server on the board: its name, and while it has a vulnerability, the severity and a countdown ring. */
function Server({ index, state, onPatch }: { index: number; state: PatchState; onPatch: (server: number) => void }) {
  const vuln = state.active.find((v) => v.server === index);
  const flash = state.flashes.filter((f) => f.server === index).at(-1);
  const left = vuln ? timeLeft(vuln, state.timeMs) : 1;
  const classes = ['server'];
  if (vuln) classes.push(`server--${vuln.severity}`);
  if (vuln && left < 0.3) classes.push('server--urgent');

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onPointerDown={(e) => {
        // On press, not release: a whack-a-mole needs every millisecond. Keyboard and screen readers use onClick.
        if (e.button === 0) onPatch(index);
      }}
      onClick={(e) => {
        if (e.detail === 0) onPatch(index);
      }}
      aria-label={vuln ? `${SERVERS[index]}: ${cfg.severities[vuln.severity].label} vulnerability. Patch it.` : `${SERVERS[index]}: up to date`}
    >
      <span className="server__key" aria-hidden="true">
        {index + 1}
      </span>
      <svg className="server__art" viewBox="0 0 100 100" aria-hidden="true">
        {vuln && (
          <>
            <circle className="server__ring-track" cx="50" cy="50" r="44" />
            <circle
              className="server__ring"
              cx="50"
              cy="50"
              r="44"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - left)}
              transform="rotate(-90 50 50)"
            />
          </>
        )}
        {/* A little server: two stacked units with status lights, red while vulnerable. */}
        <g className="server__box">
          <rect x="24" y="26" width="52" height="21" rx="4" />
          <rect x="24" y="53" width="52" height="21" rx="4" />
          <circle className="server__led" cx="33" cy="36.5" r="3.5" />
          <circle className="server__led" cx="33" cy="63.5" r="3.5" />
          <path className="server__vent" d="M45 36.5h22M45 63.5h22" />
        </g>
      </svg>
      <span className="server__name">{SERVERS[index]}</span>
      <span className="server__status">
        {vuln ? <SeverityBadge severity={vuln.severity} /> : <span className="server__ok">Up to date</span>}
      </span>
      {vuln && <span className="server__vuln">{VULNERABILITIES[vuln.kind].name}</span>}
      {flash && (
        <span key={flash.id} className={`server__flash server__flash--${flash.type}`} aria-hidden="true">
          {flash.type === 'patched' && (
            <>
              <Icon name="check" />+{flash.points}
            </>
          )}
          {flash.type === 'exploited' && (
            <>
              <Icon name="cross" />
              {flash.severity && cfg.severities[flash.severity].onExploit === 'breach'
                ? 'Breached!'
                : flash.severity && cfg.severities[flash.severity].onExploit === 'strike'
                  ? 'Strike!'
                  : 'Exploited'}
            </>
          )}
          {flash.type === 'miss' && <>−{flash.points}</>}
        </span>
      )}
    </button>
  );
}

/**
 * Patch Panic: vulnerabilities pop up on a 3 x 3 board of servers, faster and faster. Tap to patch before the
 * countdown runs out. An exploited Critical ends the game at once; an exploited High is a strike, and three end it.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(patchReducer, undefined, () =>
    initialPatchState(Math.floor(Math.random() * 2 ** 32)),
  );
  const patch = (server: number) => dispatch({ type: 'PATCH', server });

  // Game time follows the screen's frames.
  useFrameClock(!state.over, (ms) => dispatch({ type: 'TICK', ms }));

  // After the last strike, hold the final board for a moment, then the lessons.
  useEffect(() => {
    if (!state.over) return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  // Keyboard: 1-9 patch the servers in reading order.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= SERVERS.length) patch(n - 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <StrikeIndicator strikes={state.strikes} max={cfg.maxStrikes} />
      </Header>
      <main className={state.over ? 'patch patch--over' : 'patch'}>
        <div className="patch__board">
          <div className="patch__grid">
            {SERVERS.map((name, i) => (
              <Server key={name} index={i} state={state} onPatch={patch} />
            ))}
          </div>
        </div>
        <aside className="patch__legend" aria-label="Severities">
          <h2 className="patch__legend-title">Worst first</h2>
          <ul className="patch__legend-list">
            {SEVERITIES.map((severity) => (
              <li key={severity}>
                <SeverityBadge severity={severity} />
                <span className="patch__legend-points">{cfg.severities[severity].points} pts</span>
                <span className="patch__legend-rule">
                  {{ breach: 'Missed = game over', strike: 'Strike if missed', nothing: 'No strike' }[cfg.severities[severity].onExploit]}
                </span>
              </li>
            ))}
          </ul>
          <p className="patch__clock">
            <Icon name="clock" />
            {clock(state.timeMs)}
          </p>
        </aside>
        <p className="sr-only" role="status">
          {state.over ? 'Breached! Game over.' : ''}
        </p>
      </main>
    </>
  );
}
