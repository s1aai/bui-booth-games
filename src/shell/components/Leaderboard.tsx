import type { ScoreEntry } from '../leaderboard';

interface Props {
  entries: readonly ScoreEntry[];
  /** For screen readers, e.g. "Top scores: Beginner". */
  label: string;
  /** Rank (1 = top) of the player's new entry, to highlight it. */
  highlightRank?: number | null;
}

/** A board's top scores: rank, initials and score, with the player's own row picked out. */
export function Leaderboard({ entries, label, highlightRank }: Props) {
  if (entries.length === 0) return <p className="leaderboard__empty">No scores yet. Be the first!</p>;
  return (
    <ol className="leaderboard__list" aria-label={label}>
      {entries.map((entry, i) => (
        <li key={i} className={i + 1 === highlightRank ? 'leaderboard__row leaderboard__row--you' : 'leaderboard__row'}>
          <span className="leaderboard__rank">{i + 1}</span>
          <span className="leaderboard__initials">
            {entry.initials}
            {i + 1 === highlightRank && <span className="leaderboard__you">You</span>}
          </span>
          <span className="leaderboard__score">{entry.score.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  );
}
