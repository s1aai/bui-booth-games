import raw from './emails.json';
import { validateEmails, type Email } from './schema';

/** Problems found in emails.json. When non-empty, the app shows them instead of starting a game. */
export const EMAIL_PROBLEMS: string[] = validateEmails(raw);

export const EMAILS: Email[] = raw as unknown as Email[];
