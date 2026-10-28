import { useSyncExternalStore } from 'react';
import { SHELL_CONFIG } from './config';
import { parseLeaderboards, type Leaderboards } from './leaderboard';
import { parseDrawEntries, withEntry, type DrawEntry } from './prizeDraw';

/** Shared by all the games, like the theme: they run in the same kiosk browser profile. */
const BOARDS_KEY = 'bui-booth:leaderboards';
const ENTRIES_KEY = 'bui-booth:prize-draw';
const ASK_KEY = 'bui-booth:prize-draw-ask';

/** Saved leaderboards on this device. Missing or damaged data gives empty boards instead of an error. */
export function loadLeaderboards(): Leaderboards {
  try {
    const saved = localStorage.getItem(BOARDS_KEY);
    return parseLeaderboards(saved ? JSON.parse(saved) : null);
  } catch {
    return {};
  }
}

export function saveLeaderboards(boards: Leaderboards): void {
  try {
    localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
  } catch {
    // Storage blocked or full: nothing more we can do on a kiosk.
  }
}

/** Prize draw entries saved on this device. Missing or damaged data gives an empty list instead of an error. */
export function loadDrawEntries(): DrawEntry[] {
  try {
    const saved = localStorage.getItem(ENTRIES_KEY);
    return parseDrawEntries(saved ? JSON.parse(saved) : null);
  } catch {
    return [];
  }
}

export function saveDrawEntries(entries: readonly DrawEntry[]): void {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // Storage blocked or full: nothing more we can do on a kiosk.
  }
}

/** Saves an entry, unless that email or phone number is already in the draw (one entry per person). */
export function addDrawEntry(entry: DrawEntry): void {
  saveDrawEntries(withEntry(loadDrawEntries(), entry));
}

function loadAsk(): boolean {
  try {
    const saved = localStorage.getItem(ASK_KEY);
    if (saved === 'on' || saved === 'off') return saved === 'on';
  } catch {
    // Storage blocked: fall through to the default.
  }
  return SHELL_CONFIG.prizeDraw.askByDefault;
}

let ask = loadAsk();
const listeners = new Set<() => void>();

/** Switches the prize draw sign-up on or off (admin panel) and remembers it on this device. */
export function setAskForContact(on: boolean): void {
  ask = on;
  try {
    localStorage.setItem(ASK_KEY, on ? 'on' : 'off');
  } catch {
    // Storage blocked: the setting still applies until the page reloads.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useAskForContact(): boolean {
  return useSyncExternalStore(subscribe, () => ask);
}
