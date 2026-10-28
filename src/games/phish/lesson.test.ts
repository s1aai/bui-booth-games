import { describe, expect, it } from 'vitest';
import { EMAILS } from './data';
import type { Email, Tell } from './schema';
import { cardSpots, lessonTells, mistakes, placeHighlights, splitMarks } from './lesson';
import type { AnswerRecord } from './state';

const tell = (type: Tell['type'], match?: string): Tell => ({ type, text: type, target: 'body', match });

function email(id: number, isPhish: boolean, tells: Tell[]): Email {
  return {
    id,
    isPhish,
    difficulty: 1,
    category: isPhish ? 'credential-harvest' : 'legit-notification',
    from: { name: 'Sender', address: 'sender@example.com' },
    subject: 'Subject',
    body: 'Body',
    links: [],
    tells,
  };
}

const answer = (emailId: number, correct: boolean): AnswerRecord => ({
  emailId,
  guess: correct ? 'phish' : 'safe',
  correct,
  points: 0,
  multiplier: 1,
});

describe('lessonTells', () => {
  const mixed = [tell('urgency'), tell('trusted-domain'), tell('lookalike-domain'), tell('secrecy'), tell('qr-code')];

  it('shows red flags for a phish, capped', () => {
    expect(lessonTells(email(1, true, mixed), 3).map((t) => t.type)).toEqual(['urgency', 'lookalike-domain', 'secrecy']);
  });

  it('shows safe signs for a legit email', () => {
    expect(lessonTells(email(1, false, mixed), 3).map((t) => t.type)).toEqual(['trusted-domain']);
  });
});

describe('mistakes', () => {
  const deck = [email(1, true, []), email(2, false, []), email(3, true, []), email(4, false, [])];

  it('lists the wrongly answered emails in the order they came up', () => {
    const history = [answer(3, false), answer(1, true), answer(2, false), answer(4, true)];
    expect(mistakes(history, deck).map((m) => [m.email.id, m.answer.guess])).toEqual([
      [3, 'safe'],
      [2, 'safe'],
    ]);
  });

  it('is empty after a perfect run', () => {
    expect(mistakes([answer(1, true), answer(2, true)], deck)).toEqual([]);
  });
});

describe('splitMarks', () => {
  it('marks phrases in order, ignoring case', () => {
    expect(
      splitMarks('Pay the FEE within 24 hours', [
        { phrase: 'within 24 hours', mark: 2 },
        { phrase: 'fee', mark: 1 },
      ]),
    ).toEqual([
      { text: 'Pay the ' },
      { text: 'FEE', mark: 1 },
      { text: ' ' },
      { text: 'within 24 hours', mark: 2 },
    ]);
  });

  it('skips missing and overlapping phrases', () => {
    expect(
      splitMarks('verify your account now', [
        { phrase: 'your account', mark: 1 },
        { phrase: 'account now', mark: 2 },
        { phrase: 'nowhere', mark: 3 },
      ]),
    ).toEqual([{ text: 'verify ' }, { text: 'your account', mark: 1 }, { text: ' now' }]);
  });

  it('returns the text whole when nothing matches', () => {
    expect(splitMarks('plain', [])).toEqual([{ text: 'plain' }]);
  });
});

describe('lesson highlights for every email in emails.json', () => {
  // The review's lesson panel lists tells 1, 2, 3; each number must also appear as a highlight on the card.
  // A phrase that isn't found, or that overlaps another tell's phrase in the same text, would be listed
  // but never highlighted. The validator can't see overlaps, so this catches them when emails are edited.
  it('highlights every tell the lesson panel lists', () => {
    for (const email of EMAILS) {
      const tells = lessonTells(email);
      const { phrases, whole } = placeHighlights(email, tells);
      const spots = cardSpots(email);
      const shown = new Set<number>(whole.values());
      for (const [spot, list] of phrases) {
        for (const segment of splitMarks(spots.get(spot) ?? '', list)) {
          if (segment.mark) shown.add(segment.mark);
        }
      }
      const expected = tells.map((_, i) => i + 1);
      expect({ id: email.id, shown: [...shown].sort((a, b) => a - b) }).toEqual({ id: email.id, shown: expected });
    }
  });
});

