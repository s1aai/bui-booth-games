import type { GameModule, Lesson } from '../types';
import { Header } from './Header';
import { Icon } from './Icon';

interface Props {
  game: GameModule;
  /** At least one. */
  lessons: readonly Lesson[];
  onDone: () => void;
}

/**
 * After a run: what the player missed (and, in Spot the Risk, what they found), each with why it matters, in one
 * scrolling list. Done (always on screen) moves on to the end screen.
 */
export function LessonsScreen({ game, lessons, onDone }: Props) {
  return (
    <>
      <Header title={game.title} />
      <main className="screen lessons" aria-labelledby="lessons-title">
        <h1 id="lessons-title" className="lessons__title">
          {game.lessonsTitle}
        </h1>
        <ol className="lessons__list">
          {lessons.map((lesson, i) => (
            // Keyed by position: the same thing can be missed twice in a run.
            <li key={i} className={`lesson lesson--${lesson.outcome}`}>
              {lesson.visual && <div className="lesson__visual">{lesson.visual}</div>}
              <div className="lesson__body">
                <p className="lesson__title">
                  <Icon name={lesson.outcome === 'found' ? 'check' : 'cross'} />
                  <span className="sr-only">{lesson.outcome === 'found' ? 'Found:' : 'Missed:'}</span>
                  {lesson.title}
                </p>
                {lesson.text && <p className="lesson__text">{lesson.text}</p>}
                {lesson.detail}
              </div>
            </li>
          ))}
        </ol>
        <div className="lessons__done">
          <button type="button" className="btn btn--primary" onClick={onDone} autoFocus>
            Done
          </button>
        </div>
      </main>
    </>
  );
}
