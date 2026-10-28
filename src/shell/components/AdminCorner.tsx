import { useEffect, useRef, useState } from 'react';
import { isLocked, NO_LOCK, recordFailure } from '../adminPin';
import { SHELL_CONFIG } from '../config';
import type { Leaderboards } from '../leaderboard';
import type { GameModule } from '../types';
import { AdminPanel } from './AdminPanel';
import { PinPad } from './PinPad';

interface Props {
  games: readonly GameModule[];
  onBoardsChange?: (boards: Leaderboards) => void;
}

/** Wrong PINs and lockouts, kept here so leaving the menu for a game and back doesn't clear a lockout. */
let pinLock = NO_LOCK;

/**
 * The hidden way in for booth staff: hold the top-left corner (over the logo) for SHELL_CONFIG.admin.holdMs to get
 * the PIN keypad, and the right PIN opens the admin panel. Too many wrong PINs lock the keypad for a while.
 */
export function AdminCorner({ games, onBoardsChange }: Props) {
  const [pinOpen, setPinOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const holdTimer = useRef<number | undefined>(undefined);
  const { admin } = SHELL_CONFIG;

  const startHold = () => {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      if (!isLocked(pinLock, Date.now())) setPinOpen(true);
    }, admin.holdMs);
  };
  const cancelHold = () => window.clearTimeout(holdTimer.current);
  useEffect(() => cancelHold, []);

  return (
    <>
      <div
        className="admin-corner"
        aria-hidden="true"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(e) => e.preventDefault()}
      />
      {pinOpen && (
        <PinPad
          onSuccess={() => {
            pinLock = NO_LOCK;
            setPinOpen(false);
            setAdminOpen(true);
          }}
          onWrong={() => {
            pinLock = recordFailure(pinLock, Date.now(), admin);
            setPinOpen(false);
          }}
          onCancel={() => setPinOpen(false)}
        />
      )}
      {adminOpen && <AdminPanel games={games} onBoardsChange={onBoardsChange} onClose={() => setAdminOpen(false)} />}
    </>
  );
}
