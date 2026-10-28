import type { IconName } from '../../shell/components/Icon';

/** The apps a sign-in can be for. Generic on purpose: no real products. */
export const APPS: string[] = ['Email', 'Files', 'Payroll', 'VPN', 'Chat', 'HR portal'];

/**
 * What you might be doing when you're not signing in to anything. A prompt then is someone else, whatever it
 * says.
 */
export interface Activity {
  icon: IconName;
  text: string;
}

export const ACTIVITIES: Activity[] = [
  { icon: 'clock', text: "You're in a meeting" },
  { icon: 'file', text: "You're writing a report" },
  { icon: 'moon', text: "Fast asleep: it's 3 am" },
  { icon: 'sun', text: "You're on holiday" },
  { icon: 'lock', text: 'Your laptop is locked: lunch break' },
  { icon: 'check', text: 'You signed in an hour ago' },
];
