import { useEffect, useRef, useState } from 'react';
import {
  loadDrawEntries,
  loadLeaderboards,
  saveDrawEntries,
  saveLeaderboards,
  setAskForContact,
  useAskForContact,
} from '../boothStorage';
import { SHELL_CONFIG } from '../config';
import { boardsOf, toCsv, type Leaderboards } from '../leaderboard';
import { drawToCsv } from '../prizeDraw';
import type { GameModule } from '../types';
import { useIdleReset } from '../useIdleReset';

interface Props {
  /** The games in this build: their boards are listed, reset and exported. */
  games: readonly GameModule[];
  /** A board was reset (e.g. so the menu's best scores update). */
  onBoardsChange?: (boards: Leaderboards) => void;
  onClose: () => void;
}

/** Saves a CSV file (to the browser's Downloads folder) as bui-booth-<name>-<date>.csv. */
function downloadCsv(csv: string, name: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `bui-booth-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Booth staff panel, opened by holding the top-left corner and entering the PIN.
 * Resets need a second click to confirm (no browser dialogs in kiosk mode).
 * It closes itself when left alone, so visitors never find it open.
 */
export function AdminPanel({ games, onBoardsChange, onClose }: Props) {
  const [boards, setBoards] = useState(loadLeaderboards);
  const [entries, setEntries] = useState(loadDrawEntries);
  // A board's key, 'all' or 'draw': the reset waiting for its second click.
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const askForContact = useAskForContact();
  const closeButton = useRef<HTMLButtonElement>(null);
  const rows = games.flatMap((game) =>
    boardsOf(game).map(({ key, label }) => ({ key, name: label ? `${game.title} (${label})` : game.title })),
  );
  useIdleReset(true, SHELL_CONFIG.kiosk.idleResetMs, onClose);
  // Not autoFocus: that scrolls a panel taller than the screen down to Close, past its title.
  useEffect(() => closeButton.current?.focus({ preventScroll: true }), []);

  const confirmed = (target: string) => {
    if (confirming === target) return true;
    setConfirming(target);
    setMessage('');
    return false;
  };

  const reset = (target: string, name: string) => {
    if (!confirmed(target)) return;
    const next = { ...boards };
    for (const { key } of rows) if (target === 'all' || target === key) delete next[key];
    saveLeaderboards(next);
    setBoards(next);
    onBoardsChange?.(next);
    setConfirming(null);
    setMessage(target === 'all' ? 'All leaderboards cleared.' : `${name} leaderboard cleared.`);
  };

  const clearDraw = () => {
    if (!confirmed('draw')) return;
    saveDrawEntries([]);
    setEntries([]);
    setConfirming(null);
    setMessage('Prize draw entries cleared.');
  };

  const exportCsv = (csv: string, name: string, what: string) => {
    downloadCsv(csv, name);
    setConfirming(null);
    setMessage(`${what} saved to the Downloads folder.`);
  };

  const resetButton = (target: string, label: string, onClick: () => void) => (
    <button type="button" className={confirming === target ? 'btn btn--danger' : 'btn btn--ghost'} onClick={onClick}>
      {confirming === target ? 'Click again to confirm' : label}
    </button>
  );

  return (
    <div className="admin" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <div className="admin__panel">
        <h2 id="admin-title">Booth admin</h2>

        <section>
          <h3>Leaderboards</h3>
          <ul className="admin__boards">
            {rows.map(({ key, name }) => {
              const count = boards[key]?.length ?? 0;
              return (
                <li key={key}>
                  <span>
                    {name}: {count} {count === 1 ? 'score' : 'scores'}
                  </span>
                  {resetButton(key, 'Reset', () => reset(key, name))}
                </li>
              );
            })}
          </ul>
          <div className="admin__actions">
            {resetButton('all', 'Reset all', () => reset('all', ''))}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => exportCsv(toCsv(boards, games), 'scores', 'Scores')}
            >
              Export scores (CSV)
            </button>
          </div>
        </section>

        <section>
          <h3>Prize draw</h3>
          <div className="admin__actions">
            <button
              type="button"
              className="btn btn--ghost"
              aria-pressed={askForContact}
              onClick={() => {
                setAskForContact(!askForContact);
                setConfirming(null);
              }}
            >
              Prize draw question: {askForContact ? 'On' : 'Off'}
            </button>
          </div>
          <p className="admin__note">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} saved on this PC.
          </p>
          <div className="admin__actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => exportCsv(drawToCsv(entries), 'prize-draw', 'Prize draw entries')}
            >
              Export entries (CSV)
            </button>
            {resetButton('draw', 'Clear entries', clearDraw)}
          </div>
        </section>

        <p className="admin__message" role="status">
          {message}
        </p>

        <div className="admin__actions">
          <button type="button" ref={closeButton} className="btn btn--primary admin__close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
