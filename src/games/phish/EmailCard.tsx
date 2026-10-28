import { Fragment } from 'react';
import { PHISH_CONFIG } from './config';
import type { Email, Tell, TellTarget } from './schema';
import { placeHighlights, splitMarks, type MarkPhrase } from './lesson';

interface Props {
  email: Email;
  /** Tells to highlight on the card, numbered 1, 2, 3... in this order (shown after a wrong answer). */
  highlights?: readonly Tell[];
}

function Marked({ text, phrases }: { text: string; phrases?: MarkPhrase[] }) {
  if (!phrases) return <>{text}</>;
  return (
    <>
      {splitMarks(text, phrases).map((segment, i) =>
        segment.mark ? (
          <mark key={i} className="tell-mark" data-n={segment.mark}>
            {segment.text}
          </mark>
        ) : (
          <Fragment key={i}>{segment.text}</Fragment>
        ),
      )}
    </>
  );
}

export function EmailCard({ email, highlights = [] }: Props) {
  const { from, subject, body, links } = email;
  const { phrases, whole } = placeHighlights(email, highlights);
  const tone = email.isPhish ? 'flag' : 'safe';
  // A part flagged as a whole gets an outline and its number.
  const flag = (target: TellTarget, className: string) => {
    const mark = whole.get(target);
    return mark === undefined ? { className } : { className: `${className} tell-part`, 'data-n': mark };
  };

  return (
    <article
      className={highlights.length > 0 ? `email-card email-card--lesson-${tone}` : 'email-card'}
      aria-label={`Email from ${from.name}`}
    >
      <header className="email-card__header">
        <div className="email-card__avatar" aria-hidden="true">
          {from.name.trim().charAt(0).toUpperCase()}
        </div>
        <div {...flag('from', 'email-card__meta')}>
          <span className="email-card__from-name">
            <Marked text={from.name} phrases={phrases.get('name')} />
          </span>
          <span className="email-card__from-address">
            &lt;
            <Marked text={from.address} phrases={phrases.get('address')} />
            &gt;
          </span>
          <span className="email-card__to">
            To: {PHISH_CONFIG.inbox.name} &lt;{PHISH_CONFIG.inbox.address}&gt;
          </span>
        </div>
      </header>

      <h2 {...flag('subject', 'email-card__subject')}>
        <Marked text={subject} phrases={phrases.get('subject')} />
      </h2>
      <p {...flag('body', 'email-card__body')}>
        <Marked text={body} phrases={phrases.get('body')} />
      </p>

      {links.length > 0 && (
        <ul {...flag('link', 'email-card__links')} aria-label="Links in this email">
          {links.map((link, i) => (
            // Deliberately not clickable: players inspect where each link really goes.
            <li key={i} className="email-card__link">
              <span className="email-card__link-text">
                <Marked text={link.text} phrases={phrases.get(`link-text-${i}`)} />
              </span>
              <span className="email-card__link-href">
                <span className="email-card__link-label">Goes to:</span>{' '}
                <Marked text={link.href} phrases={phrases.get(`link-href-${i}`)} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
