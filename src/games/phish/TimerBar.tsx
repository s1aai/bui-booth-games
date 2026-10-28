import type { CSSProperties } from 'react';

interface Props {
  durationMs: number;
  /** False while feedback is showing: the bar freezes where the player answered. */
  running: boolean;
}

/**
 * Shrinking bar for the time left on this email. It's a pure CSS animation, so it costs no re-renders;
 * Play owns the real timeout. Give it a new `key` per card to restart it.
 */
export function TimerBar({ durationMs, running }: Props) {
  const seconds = Math.round(durationMs / 1000);
  const style = { '--timer-ms': `${durationMs}ms` } as CSSProperties;

  return (
    <div className="ps-timer" role="img" aria-label={`${seconds} seconds to answer this email`}>
      <div className={running ? 'ps-timer__fill' : 'ps-timer__fill ps-timer__fill--paused'} style={style} />
    </div>
  );
}
