import { SHELL_CONFIG } from './config';
import type { GameModule } from './types';

export interface ScoreEntry {
  initials: string;
  score: number;
  /** When the score was set, as an ISO date string. Only used in the CSV export. */
  date: string;
}

/** Top scores for each board, best first, keyed by boardKey. A board nobody has scored on yet may be missing. */
export type Leaderboards = Record<string, ScoreEntry[]>;

/** The key a run's scores are kept under: the game's id, plus the board (e.g. Phish or Safe's level) if it has several. */
export function boardKey(gameId: string, board?: string): string {
  return board ? `${gameId}:${board}` : gameId;
}

/** A game's boards: one per entry in its `boards` (with that label), or a single unlabelled one. */
export function boardsOf(game: GameModule): { key: string; label: string }[] {
  return game.boards
    ? game.boards.map(({ id, label }) => ({ key: boardKey(game.id, id), label }))
    : [{ key: game.id, label: '' }];
}

/** The best score on any of the game's boards (for its card on the menu), or null if there are none. */
export function bestFor(boards: Leaderboards, game: GameModule): ScoreEntry | null {
  let best: ScoreEntry | null = null;
  for (const { key } of boardsOf(game)) {
    const top = boards[key]?.[0];
    if (top && (!best || top.score > best.score)) best = top;
  }
  return best;
}

/** Where a score would land on a board (1 = top), or null if it doesn't make the cut. Ties go below existing scores. */
export function rankFor(
  board: readonly ScoreEntry[],
  score: number,
  size = SHELL_CONFIG.leaderboard.size,
): number | null {
  if (score <= 0) return null;
  const position = board.filter((entry) => entry.score >= score).length;
  return position < size ? position + 1 : null;
}

/** The board with the entry added (if it made the cut), trimmed to size, plus where it landed. */
export function addScore(
  board: readonly ScoreEntry[],
  entry: ScoreEntry,
  size = SHELL_CONFIG.leaderboard.size,
): { board: ScoreEntry[]; rank: number | null } {
  const rank = rankFor(board, entry.score, size);
  if (rank === null) return { board: board.slice(0, size), rank };
  const next = [...board.slice(0, rank - 1), entry, ...board.slice(rank - 1)].slice(0, size);
  return { board: next, rank };
}

const isEntry = (v: unknown): v is ScoreEntry => {
  if (typeof v !== 'object' || v === null) return false;
  const { initials, score, date } = v as Record<string, unknown>;
  return typeof initials === 'string' && typeof score === 'number' && Number.isFinite(score) && typeof date === 'string';
};

/** Turns whatever was in storage into valid leaderboards, dropping anything malformed instead of crashing. */
export function parseLeaderboards(raw: unknown, size = SHELL_CONFIG.leaderboard.size): Leaderboards {
  const boards: Leaderboards = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return boards;
  for (const [key, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    boards[key] = list
      .filter(isEntry)
      .sort((a, b) => b.score - a.score)
      .slice(0, size);
  }
  return boards;
}

export const csvField = (value: string | number): string => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** The games' boards as CSV, one row per score: Game, Level, Rank, Initials, Score, Date. */
export function toCsv(boards: Leaderboards, games: readonly GameModule[]): string {
  const rows = [['Game', 'Level', 'Rank', 'Initials', 'Score', 'Date']];
  for (const game of games) {
    for (const { key, label } of boardsOf(game)) {
      (boards[key] ?? []).forEach((entry, i) => {
        rows.push([game.title, label, String(i + 1), entry.initials, String(entry.score), entry.date]);
      });
    }
  }
  return rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}
