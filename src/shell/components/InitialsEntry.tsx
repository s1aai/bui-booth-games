import { useState, type FormEvent } from 'react';
import { cleanInitials, INITIALS_LENGTH, isBlocked, isComplete } from '../initials';
import { Header } from './Header';

interface Props {
  title: string;
  score: number;
  /** Where the score will land (1 = top). */
  rank: number;
  /** The board's name, e.g. Phish or Safe's level; empty for a game with one board. */
  boardLabel: string;
  onSubmit: (initials: string) => void;
}

/** Arcade-style initials for a new top score, typed on the booth's keyboard. Walking away saves nothing. */
export function InitialsEntry({ title, score, rank, boardLabel, onSubmit }: Props) {
  const [initials, setInitials] = useState('');
  const blocked = isComplete(initials) && isBlocked(initials);
  const canSave = isComplete(initials) && !blocked;
  const board = boardLabel ? `the ${boardLabel} leaderboard` : 'the leaderboard';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (canSave) onSubmit(initials);
  };

  return (
    <>
      <Header title={title} />
      <main className="screen initials" aria-labelledby="initials-title">
        <h1 id="initials-title" className="initials__title">
          New high score!
        </h1>
        <p className="initials__detail">
          {score.toLocaleString()} points: <strong>#{rank}</strong> on {board}
        </p>
        <form className="initials__form" onSubmit={submit} noValidate>
          <label className="initials__prompt" htmlFor="initials-input">
            Type your initials
          </label>
          <input
            id="initials-input"
            className="field initials__input"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={INITIALS_LENGTH}
            placeholder="AAA"
            value={initials}
            onChange={(e) => setInitials(cleanInitials(e.target.value))}
            autoFocus
          />
          <p className="initials__warning" role="alert">
            {blocked ? 'Please choose different initials.' : ''}
          </p>
          <button type="submit" className="btn btn--primary btn--hero" aria-disabled={!canSave}>
            Save
          </button>
        </form>
      </main>
    </>
  );
}
