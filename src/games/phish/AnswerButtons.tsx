import type { Verdict } from './state';
import { Icon } from '../../shell/components/Icon';

interface Props {
  onAnswer: (guess: Verdict) => void;
  /** True while feedback is showing. Taps are ignored, but the buttons keep focus for keyboard users. */
  locked: boolean;
}

/**
 * Small Phish / Safe buttons. On landscape screens CSS places them either side of the card, where they
 * also show which way to swipe; on phones they're a slim row under it. Tapping one answers, like a swipe.
 */
export function AnswerButtons({ onAnswer, locked }: Props) {
  const answer = (guess: Verdict) => {
    if (!locked) onAnswer(guess);
  };

  return (
    <div className="answer-buttons">
      <button
        type="button"
        className="answer-btn answer-btn--phish"
        onClick={() => answer('phish')}
        aria-disabled={locked}
        aria-label="Phish: this email is a scam"
      >
        <span className="answer-btn__icon">
          <Icon name="hook" />
        </span>
        <span className="answer-btn__label">
          <Icon name="arrow-left" className="answer-btn__arrow" />
          Phish
        </span>
      </button>
      <button
        type="button"
        className="answer-btn answer-btn--safe"
        onClick={() => answer('safe')}
        aria-disabled={locked}
        aria-label="Safe: this email is legitimate"
      >
        <span className="answer-btn__icon">
          <Icon name="shield" />
        </span>
        <span className="answer-btn__label">
          Safe
          <Icon name="arrow-right" className="answer-btn__arrow" />
        </span>
      </button>
    </div>
  );
}
