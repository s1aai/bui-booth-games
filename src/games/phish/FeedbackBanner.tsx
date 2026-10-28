import type { Email } from './schema';
import type { AnswerRecord } from './state';
import { Icon } from '../../shell/components/Icon';

export function feedbackText(answer: AnswerRecord, email: Email): { title: string; detail: string } {
  if (answer.correct) {
    const streak = answer.multiplier > 1 ? ` · streak ×${answer.multiplier.toFixed(1)}` : '';
    return { title: 'Correct!', detail: `+${answer.points}${streak}` };
  }
  const title = answer.guess === null ? "Time's up!" : 'Strike!';
  return { title, detail: email.isPhish ? 'That was a phish.' : 'That one was legit.' };
}

/**
 * Visual verdict after each answer, shown where the card was. What gave a missed email away comes in the
 * end-of-run review ("What you missed").
 * Screen readers get the same text from Play's live region.
 */
export function FeedbackBanner({ answer, email }: { answer: AnswerRecord; email: Email }) {
  const { title, detail } = feedbackText(answer, email);

  return (
    <div className={`ps-feedback ${answer.correct ? 'ps-feedback--correct' : 'ps-feedback--wrong'}`} aria-hidden="true">
      <div className="ps-feedback__panel">
        <div className="ps-feedback__title">
          <Icon name={answer.correct ? 'check' : 'cross'} />
          {title}
        </div>
        <div className="ps-feedback__detail">{detail}</div>
      </div>
    </div>
  );
}
