import { describe, expect, it } from 'vitest';
import { drawToCsv, isValidContact, parseDrawEntries, withEntry, type DrawEntry } from './prizeDraw';

const entry: DrawEntry = { contact: '+27 82 555 1234', date: '2026-10-27T10:00:00.000Z' };

describe('isValidContact', () => {
  it('accepts email addresses and phone numbers', () => {
    for (const ok of [
      'alex@brightwell.co',
      'a.b+c@mail.example.com',
      '082 555 1234',
      '+27 82 555 1234',
      '0825551234',
      '012-555-1234',
    ]) {
      expect({ ok, valid: isValidContact(ok) }).toEqual({ ok, valid: true });
    }
  });

  it('rejects anything else', () => {
    for (const bad of ['', 'alex', 'alex@', 'alex@brightwell', '12345', '+27', '1234567890123456', '=1+1@a.co']) {
      expect({ bad, valid: isValidContact(bad) }).toEqual({ bad, valid: false });
    }
  });
});

describe('withEntry', () => {
  const email: DrawEntry = { ...entry, contact: 'Alex@Brightwell.co' };

  it('adds a new email or phone number', () => {
    expect(withEntry([entry], email)).toEqual([entry, email]);
  });

  it('keeps one entry per person, however the contact was typed', () => {
    expect(withEntry([email], { ...entry, contact: ' alex@brightwell.co ' })).toEqual([email]);
    expect(withEntry([entry], { ...entry, contact: '+27-82-555-1234' })).toEqual([entry]);
  });

  it('treats the same phone number with or without its country code as one person', () => {
    expect(withEntry([entry], { ...entry, contact: '082 555 1234' })).toEqual([entry]);
    const local: DrawEntry = { ...entry, contact: '082 555 1234' };
    expect(withEntry([local], { ...entry, contact: '+27 82 555 1234' })).toEqual([local]);
  });

  it('treats email +tags, and dots or googlemail.com at Gmail, as the same inbox', () => {
    const gmail: DrawEntry = { ...entry, contact: 'alex.smith@gmail.com' };
    for (const again of ['alexsmith@gmail.com', 'Alex.Smith+draw@gmail.com', 'a.l.e.x.smith@googlemail.com']) {
      expect({ again, entries: withEntry([gmail], { ...gmail, contact: again }) }).toEqual({ again, entries: [gmail] });
    }
    expect(withEntry([email], { ...email, contact: 'alex+2@brightwell.co' })).toEqual([email]);
  });

  it('still tells different people apart', () => {
    // Dots only don't matter at Gmail: elsewhere a.b@ and ab@ can be two different people.
    const outlook: DrawEntry = { ...entry, contact: 'alex.smith@outlook.com' };
    expect(withEntry([outlook], { ...outlook, contact: 'alexsmith@outlook.com' })).toHaveLength(2);
    expect(withEntry([email], { ...email, contact: 'alex@brightwell.com' })).toHaveLength(2);
    expect(withEntry([entry], { ...entry, contact: '082 555 1235' })).toHaveLength(2);
  });
});

describe('parseDrawEntries', () => {
  it('keeps valid entries and drops damaged ones', () => {
    expect(parseDrawEntries([entry, { contact: 'x' }, null, { date: entry.date }])).toEqual([entry]);
  });

  it('gives an empty list for anything that is not a list', () => {
    expect(parseDrawEntries(null)).toEqual([]);
    expect(parseDrawEntries({ entry })).toEqual([]);
  });
});

describe('drawToCsv', () => {
  it('writes one row per entry, keeping a phone number as text for Excel', () => {
    expect(drawToCsv([entry])).toBe('Date,Contact\r\n2026-10-27T10:00:00.000Z,"=""+27 82 555 1234"""\r\n');
  });
});
