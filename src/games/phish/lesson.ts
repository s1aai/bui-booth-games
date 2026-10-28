import { PHISH_CONFIG } from './config';
import {
  RED_FLAG_TYPES,
  SAFE_SIGN_TYPES,
  type Email,
  type Tell,
  type TellTarget,
} from './schema';
import type { AnswerRecord } from './state';

/** The tells that explain the right answer (red flags for a phish, safe signs for a legit email), at most `max`. */
export function lessonTells(email: Email, max = PHISH_CONFIG.feedback.maxTells): Tell[] {
  const wanted: readonly string[] = email.isPhish ? RED_FLAG_TYPES : SAFE_SIGN_TYPES;
  return email.tells.filter((tell) => wanted.includes(tell.type)).slice(0, max);
}

export interface Mistake {
  answer: AnswerRecord;
  email: Email;
}

/** The emails the player got wrong (or ran out of time on), in the order they came up. For the end-of-run review. */
export function mistakes(history: readonly AnswerRecord[], deck: readonly Email[]): Mistake[] {
  return history.flatMap((answer) => {
    const email = deck.find((e) => e.id === answer.emailId);
    return !answer.correct && email ? [{ answer, email }] : [];
  });
}

export interface MarkPhrase {
  phrase: string;
  /** Number shown on the highlight, matching the tell's number in the list. */
  mark: number;
}

export interface Segment {
  text: string;
  /** Set when this piece is highlighted. */
  mark?: number;
}

/**
 * Splits text so the first occurrence of each phrase (ignoring case) becomes its own marked piece.
 * Phrases that aren't found, or overlap one already marked, are skipped.
 */
export function splitMarks(text: string, phrases: readonly MarkPhrase[]): Segment[] {
  const lower = text.toLowerCase();
  const ranges: { start: number; end: number; mark: number }[] = [];
  for (const { phrase, mark } of phrases) {
    const start = phrase ? lower.indexOf(phrase.toLowerCase()) : -1;
    if (start === -1) continue;
    const end = start + phrase.length;
    if (ranges.some((r) => start < r.end && end > r.start)) continue;
    ranges.push({ start, end, mark });
  }
  ranges.sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let pos = 0;
  for (const { start, end, mark } of ranges) {
    if (start > pos) segments.push({ text: text.slice(pos, start) });
    segments.push({ text: text.slice(start, end), mark });
    pos = end;
  }
  if (pos < text.length || segments.length === 0) segments.push({ text: text.slice(pos) });
  return segments;
}

const has = (text: string, phrase: string) => text.toLowerCase().includes(phrase.toLowerCase());

/**
 * Works out which piece of the card each highlight lands on: the sender's name or address, the subject,
 * the body, or one link's text or address (keys: name, address, subject, body, link-text-N, link-href-N;
 * see cardSpots). A tell without a `match` flags its whole part of the card.
 */
export function placeHighlights(email: Email, tells: readonly Tell[]) {
  const phrases = new Map<string, MarkPhrase[]>();
  const whole = new Map<TellTarget, number>();
  const add = (spot: string, phrase: string, mark: number) => {
    phrases.set(spot, [...(phrases.get(spot) ?? []), { phrase, mark }]);
  };

  tells.forEach(({ target, match }, i) => {
    const mark = i + 1;
    if (!match) {
      if (!whole.has(target)) whole.set(target, mark);
    } else if (target === 'from') {
      add(has(email.from.name, match) ? 'name' : 'address', match, mark);
    } else if (target === 'link') {
      const j = email.links.findIndex((link) => has(link.text, match) || has(link.href, match));
      if (j !== -1) add(has(email.links[j].text, match) ? `link-text-${j}` : `link-href-${j}`, match, mark);
    } else {
      add(target, match, mark);
    }
  });
  return { phrases, whole };
}

/** Every piece of text on a card that can carry highlights, keyed the same way as placeHighlights. */
export function cardSpots(email: Email): Map<string, string> {
  const spots = new Map<string, string>([
    ['name', email.from.name],
    ['address', email.from.address],
    ['subject', email.subject],
    ['body', email.body],
  ]);
  email.links.forEach((link, j) => {
    spots.set(`link-text-${j}`, link.text);
    spots.set(`link-href-${j}`, link.href);
  });
  return spots;
}
