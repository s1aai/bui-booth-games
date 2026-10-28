/**
 * Shape of src/data/emails.json, plus a validator that turns mistakes in that
 * file into readable messages instead of a broken game.
 */

export const DIFFICULTIES = [1, 2, 3] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const EMAIL_CATEGORIES = [
  'credential-harvest',
  'invoice-fraud',
  'delivery-scam',
  'fake-helpdesk',
  'ceo-fraud',
  'mfa-fatigue',
  'quishing',
  'legit-notification',
  'legit-internal',
] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

/** Warning signs that point to a phish. */
export const RED_FLAG_TYPES = [
  'lookalike-domain', // zyntra-bank-secure.xyz, supp1ies.com, brightwell-co.evil.com
  'external-sender', // "internal" or executive email from a webmail/outside address
  'mismatched-link', // link text shows one address, the href goes somewhere else
  'urgency', // deadlines, threats, "act now"
  'generic-greeting', // "Dear Customer"
  'spelling-grammar',
  'credential-request', // "sign in to re-validate your account"
  'payment-request', // fees, gift cards, wire transfers
  'payment-change', // "our bank details have changed"
  'suspicious-attachment',
  'authority-pressure', // a senior person leaning on you
  'secrecy', // "keep this between us"
  'unsolicited-mfa', // approve a sign-in prompt you didn't start
  'qr-code', // scan-to-sign-in hides the real destination
  'too-good-to-be-true',
] as const;

/** Signs that an email (even an urgent or scary-looking one) is legitimate. */
export const SAFE_SIGN_TYPES = [
  'trusted-domain',
  'matching-link',
  'expected-activity',
  'no-sensitive-request',
  'verifiable-channel',
] as const;

export const TELL_TYPES = [...RED_FLAG_TYPES, ...SAFE_SIGN_TYPES] as const;
export type TellType = (typeof TELL_TYPES)[number];

/** Which part of the card a tell points at, so it can be highlighted. */
export const TELL_TARGETS = ['from', 'subject', 'body', 'link'] as const;
export type TellTarget = (typeof TELL_TARGETS)[number];

export interface Tell {
  type: TellType;
  /** Short explanation shown to the player. */
  text: string;
  target: TellTarget;
  /** Exact phrase inside the target to highlight. Omit to highlight the whole target. */
  match?: string;
}

export interface EmailLink {
  text: string;
  href: string;
}

export interface Email {
  id: number;
  isPhish: boolean;
  difficulty: Difficulty;
  category: EmailCategory;
  from: { name: string; address: string };
  subject: string;
  body: string;
  links: EmailLink[];
  tells: Tell[];
}

/** Longest body that still fits on one card without scrolling. */
export const MAX_BODY_WORDS = 60;

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';
const oneOf = <T>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v);
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** The text a tell's `match` phrase must appear in. */
function targetText(email: Obj, target: TellTarget): string {
  const { from, links } = email;
  switch (target) {
    case 'from':
      return isObj(from) ? `${str(from.name)} ${str(from.address)}` : '';
    case 'subject':
      return str(email.subject);
    case 'body':
      return str(email.body);
    case 'link':
      return Array.isArray(links)
        ? links.map((l) => (isObj(l) ? `${str(l.text)} ${str(l.href)}` : '')).join(' ')
        : '';
  }
}

/**
 * Checks the contents of emails.json. Returns human-readable problems;
 * an empty list means every email is usable.
 */
export function validateEmails(raw: unknown): string[] {
  if (!Array.isArray(raw)) return ['emails.json must be a list ([ ... ]) of emails.'];

  const problems: string[] = [];
  const ids = new Set<number>();

  raw.forEach((item: unknown, i) => {
    const label = isObj(item) && item.id !== undefined ? `Email id ${String(item.id)}` : `Email #${i + 1}`;
    const report = (msg: string): void => {
      problems.push(`${label}: ${msg}`);
    };

    if (!isObj(item)) return report('must be an object ({ ... }).');
    const email: Obj = item;
    const { id, isPhish, difficulty, category, from, subject, body, links, tells } = email;

    if (typeof id !== 'number' || !Number.isInteger(id)) report('"id" must be a whole number.');
    else if (ids.has(id)) report('"id" is already used by another email.');
    else ids.add(id);

    if (typeof isPhish !== 'boolean') report('"isPhish" must be true or false.');
    if (!oneOf(DIFFICULTIES, difficulty)) report('"difficulty" must be 1, 2 or 3.');
    if (!oneOf(EMAIL_CATEGORIES, category)) {
      report(`"category" must be one of: ${EMAIL_CATEGORIES.join(', ')}.`);
    }

    if (!isObj(from) || !isText(from.name) || !str(from.address).includes('@')) {
      report('"from" needs a "name" and an "address" containing @.');
    }
    if (!isText(subject)) report('"subject" is required.');
    if (!isText(body)) report('"body" is required.');
    else if (wordCount(body) > MAX_BODY_WORDS) {
      report(`"body" is ${wordCount(body)} words; keep it to ${MAX_BODY_WORDS} or fewer so the card fits on screen.`);
    }

    if (!Array.isArray(links) || !links.every((l) => isObj(l) && isText(l.text) && isText(l.href))) {
      report('"links" must be a list of { "text", "href" } (use [] for none).');
    }

    if (!Array.isArray(tells) || tells.length === 0) return report('"tells" must list at least one tell.');

    tells.forEach((tell: unknown, j) => {
      const reportTell = (msg: string) => report(`tell ${j + 1}: ${msg}`);
      if (!isObj(tell)) return reportTell('must be an object ({ ... }).');

      const { type, text, target, match } = tell;
      if (!oneOf(TELL_TYPES, type)) reportTell(`"type" "${String(type)}" is not a known tell type.`);
      if (!isText(text)) reportTell('"text" is required.');
      if (!oneOf(TELL_TARGETS, target)) {
        return reportTell(`"target" must be one of: ${TELL_TARGETS.join(', ')}.`);
      }
      if (target === 'link' && Array.isArray(links) && links.length === 0) {
        reportTell('points at a link, but the email has no links.');
      }
      if (match !== undefined) {
        if (!isText(match)) reportTell('"match" must be text.');
        else if (!targetText(email, target).toLowerCase().includes(match.toLowerCase())) {
          reportTell(`"match" text "${match}" does not appear in the ${target}.`);
        }
      }
    });

    if (typeof isPhish === 'boolean') {
      const wanted: readonly string[] = isPhish ? RED_FLAG_TYPES : SAFE_SIGN_TYPES;
      if (!tells.some((t) => isObj(t) && oneOf(wanted, t.type))) {
        report(isPhish ? 'a phish needs at least one red-flag tell.' : 'a legit email needs at least one safe-sign tell.');
      }
    }
  });

  return problems;
}
