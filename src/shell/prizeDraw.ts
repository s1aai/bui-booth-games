import { csvField } from './leaderboard';

/** One prize draw entry: the contact details a visitor left at the start. */
export interface DrawEntry {
  /** An email address or phone number, as typed. */
  contact: string;
  /** When it was entered, as an ISO date string. */
  date: string;
}

export const MAX_CONTACT_LENGTH = 60;

/** Only the characters an email address or phone number needs (also keeps formulas out of the CSV). */
const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const PHONE = /^\+?[0-9 -]+$/;

/** Whether the text looks like an email address or a phone number (7 to 15 digits). Loose on purpose. */
export function isValidContact(text: string): boolean {
  const value = text.trim();
  if (value.length > MAX_CONTACT_LENGTH) return false;
  if (EMAIL.test(value)) return true;
  const digits = value.replace(/\D/g, '').length;
  return PHONE.test(value) && digits >= 7 && digits <= 15;
}

/**
 * Phone numbers match on their last 9 digits, so a number typed with and without its country code
 * (+27 82 555 1234 / 082 555 1234) is still one person. Shorter numbers compare in full.
 */
const PHONE_MATCH_DIGITS = 9;

/**
 * Who a contact belongs to, however it was typed, so one person can't enter the draw twice:
 * - emails ignore case and any "+tag" (alex+2@x.com is alex@x.com); at Gmail, dots don't count either,
 *   and googlemail.com is gmail.com;
 * - phone numbers compare digits only, and only the last 9 of them.
 */
export function contactKey(contact: string): string {
  const value = contact.trim().toLowerCase();
  const at = value.lastIndexOf('@');
  if (at === -1) return value.replace(/\D/g, '').slice(-PHONE_MATCH_DIGITS);

  const name = value.slice(0, at);
  let local = name.split('+')[0] || name;
  let domain = value.slice(at + 1);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') local = local.replace(/\./g, '');
  return `${local}@${domain}`;
}

/** The entries with this one added, unless its email or phone number is already in: one entry per person. */
export function withEntry(entries: readonly DrawEntry[], entry: DrawEntry): DrawEntry[] {
  const key = contactKey(entry.contact);
  return entries.some((e) => contactKey(e.contact) === key) ? [...entries] : [...entries, entry];
}

const isEntry = (v: unknown): v is DrawEntry => {
  if (typeof v !== 'object' || v === null) return false;
  const { contact, date } = v as Record<string, unknown>;
  return typeof contact === 'string' && typeof date === 'string';
};

/** Turns whatever was in storage into a list of entries, dropping anything malformed instead of crashing. */
export function parseDrawEntries(raw: unknown): DrawEntry[] {
  return Array.isArray(raw) ? raw.filter(isEntry) : [];
}

/**
 * All entries as CSV, oldest first: Date, Contact.
 * The contact is written as ="..." so Excel keeps a phone number's leading + or 0 instead of reading a number.
 */
export function drawToCsv(entries: readonly DrawEntry[]): string {
  const rows = [['Date', 'Contact']];
  for (const { date, contact } of entries) rows.push([date, `="${contact.replace(/"/g, '')}"`]);
  return rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
}
