import { useEffect, useReducer, useRef, type CSSProperties } from 'react';
import { Header, Stat } from '../../shell/components/Header';
import { Icon } from '../../shell/components/Icon';
import { StrikeIndicator } from '../../shell/components/StrikeIndicator';
import type { GameResult, PlayProps } from '../../shell/types';
import { useFrameClock } from '../../shell/useFrameClock';
import { FIREWALL_CONFIG } from './config';
import { FILES, type FileItem } from './data';
import {
  firewallReducer,
  initialFirewallState,
  mistakeLessons,
  progress,
  type FirewallState,
  type Outcome,
} from './logic';
import './firewall.css';

const cfg = FIREWALL_CONFIG;

/** On a narrow screen a long name wraps before a dot or after an underscore ("setup_guide / .pdf"), not mid-word. */
function wrappable(name: string) {
  return name.split(/(?=\.)|(?<=_)/).flatMap((part, i) => (i > 0 ? [<wbr key={i} />, part] : [part]));
}

/** A file as it appears falling, and on the lessons page with what it really was. */
function FileCard({ file, verdict }: { file: FileItem; verdict?: boolean }) {
  return (
    <span className="fw-file__card">
      <Icon name="file" />
      <code className="fw-file__name">{wrappable(file.name)}</code>
      {verdict && (
        <span className={file.dangerous ? 'fw-file__tag fw-file__tag--bad' : 'fw-file__tag fw-file__tag--good'}>
          {file.dangerous ? 'Malware' : 'Safe'}
        </span>
      )}
    </span>
  );
}

function clock(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function toResult(state: FirewallState): GameResult {
  const count = (type: Outcome['type']) => state.outcomes.filter((o) => o.type === type).length;
  return {
    score: state.score,
    complete: false,
    title: 'Firewall down!',
    reason: `You held out for ${clock(state.timeMs)}.`,
    stats: [
      { label: 'Malware blocked', value: String(count('blocked')) },
      { label: 'Files let through', value: String(count('delivered')) },
      { label: 'Best streak', value: String(state.bestStreak) },
    ],
    lessons: mistakeLessons(state.outcomes).map((m) => ({
      outcome: 'missed',
      title: m.type === 'breach' ? `${m.file.name} got through` : `You blocked ${m.file.name}`,
      text: m.count > 1 ? `${m.file.why} (${m.count} times)` : m.file.why,
      visual: <FileCard file={m.file} verdict />,
    })),
  };
}

/** "Blocked! +100" and the like, where it happened, for a moment. */
function effectText(outcome: Outcome): string {
  switch (outcome.type) {
    case 'blocked':
      return `Blocked! +${outcome.points}`;
    case 'delivered':
      return `+${outcome.points}`;
    case 'wrongBlock':
      return 'Strike! That was safe';
    case 'breach':
      return 'Strike! Malware got in';
  }
}

/**
 * Firewall Frenzy: email attachments fall toward your network. Tap the dangerous ones to block them and let the
 * safe ones through; three mistakes end the game. It keeps getting faster, with trickier files.
 */
export function Play({ onFinish }: PlayProps) {
  const [state, dispatch] = useReducer(firewallReducer, undefined, () =>
    initialFirewallState(Math.floor(Math.random() * 2 ** 32)),
  );
  useFrameClock(!state.over, (ms) => dispatch({ type: 'TICK', ms }));

  // After the last strike, hold the final screen for a moment, then the lessons.
  useEffect(() => {
    if (!state.over) return;
    const id = window.setTimeout(() => onFinish(toResult(state)), cfg.endDelayMs);
    return () => window.clearTimeout(id);
  }, [state, onFinish]);

  // Keyboard: 1-4 block the lowest file in that column. Reads the latest state through a ref, so the listener
  // isn't re-added every frame.
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      const lane = Number(e.key) - 1;
      if (!Number.isInteger(lane) || lane < 0 || lane >= cfg.lanes) return;
      const { drops, timeMs } = stateRef.current;
      const inLane = drops.filter((d) => d.lane === lane);
      if (inLane.length === 0) return;
      const lowest = inLane.reduce((a, b) => (progress(b, timeMs) > progress(a, timeMs) ? b : a));
      dispatch({ type: 'BLOCK', id: lowest.id });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const recent = state.outcomes.filter((o) => o.atMs + cfg.effectMs > state.timeMs);
  const breached = recent.some((o) => o.type === 'breach');

  return (
    <>
      <Header title={cfg.title}>
        <Stat label="Score">{state.score.toLocaleString()}</Stat>
        <StrikeIndicator strikes={state.strikes} max={cfg.maxStrikes} />
      </Header>
      <main className={state.over ? 'fw fw--over' : 'fw'}>
        <p className="fw__hint">
          <Icon name="bug" /> Block the malware <Icon name="file" /> Let real files through
          {state.streak > 1 && <span className="fw__streak">Streak {state.streak}</span>}
        </p>
        <div className="fw__field" style={{ '--lanes': cfg.lanes } as CSSProperties}>
          {Array.from({ length: cfg.lanes - 1 }, (_, i) => (
            <span key={i} className="fw__lane-line" style={{ '--lane': i + 1 } as CSSProperties} aria-hidden="true" />
          ))}
          {state.drops.map((drop) => (
            <button
              key={drop.id}
              type="button"
              className="fw-file"
              style={{ '--lane': drop.lane, '--p': progress(drop, state.timeMs) } as CSSProperties}
              onPointerDown={(e) => {
                // On press, not release: the file is moving.
                if (e.button === 0) dispatch({ type: 'BLOCK', id: drop.id });
              }}
              onClick={(e) => {
                if (e.detail === 0) dispatch({ type: 'BLOCK', id: drop.id });
              }}
              aria-label={`Block ${FILES[drop.file].name}`}
            >
              <FileCard file={FILES[drop.file]} />
            </button>
          ))}
          {recent.map((o) => (
            <span
              key={`e${o.id}`}
              className={`fw-effect fw-effect--${o.type}`}
              style={{ '--lane': o.lane, '--p': o.progress } as CSSProperties}
              aria-hidden="true"
            >
              {effectText(o)}
            </span>
          ))}
        </div>
        <div className={breached ? 'fw__network fw__network--breach' : 'fw__network'}>
          <Icon name="firewall" />
          <span>{breached ? 'Breach!' : 'Your network'}</span>
          <Icon name="server" />
        </div>
        <p className="sr-only" role="status">
          {recent.length > 0 ? effectText(recent[recent.length - 1]) : ''}
        </p>
      </main>
    </>
  );
}
