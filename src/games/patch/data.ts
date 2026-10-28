import type { Severity } from './config';

/** The nine servers on the board, in reading order (top left first). Generic on purpose: no real products. */
export const SERVERS: string[] = ['Email', 'VPN', 'Website', 'Files', 'Payroll', 'Logins', 'Database', 'Backups', 'Wi-Fi'];

export interface Vulnerability {
  name: string;
  severity: Severity;
  /** What an attacker gets if it isn't patched, in one sentence, for the "What got exploited" page. */
  why: string;
}

/** Flavour: each vulnerability that pops up gets one of these, matching its severity. Generic, no real products. */
export const VULNERABILITIES: Vulnerability[] = [
  { name: 'Remote code execution', severity: 'critical', why: 'Lets an attacker run their own code on the server from anywhere.' },
  { name: 'Zero-day under attack', severity: 'critical', why: 'Attackers are already using it, so every hour unpatched counts.' },
  { name: 'Admin access, no password', severity: 'critical', why: 'Anyone who finds it gets full control, no login needed.' },
  { name: 'Ransomware way in', severity: 'critical', why: 'A known entry point for ransomware gangs to lock up your files.' },
  { name: 'Wormable flaw', severity: 'critical', why: 'Spreads itself from machine to machine without anyone clicking anything.' },

  { name: 'Privilege escalation', severity: 'high', why: 'Turns an ordinary account into an admin one.' },
  { name: 'SQL injection', severity: 'high', why: 'Lets an attacker read or change the data behind the service.' },
  { name: 'Password hashes exposed', severity: 'high', why: 'Leaks the scrambled passwords, ready to crack offline.' },
  { name: 'Session hijacking', severity: 'high', why: "Lets an attacker take over someone's logged-in session." },
  { name: 'Cross-site scripting', severity: 'high', why: "Runs an attacker's script in the browsers of the people using it." },

  { name: 'Version number leak', severity: 'low', why: 'Tells attackers which software it runs, which helps them plan.' },
  { name: 'Verbose error pages', severity: 'low', why: 'Error messages show internal details that should stay private.' },
  { name: 'Missing security header', severity: 'low', why: "A browser protection isn't switched on." },
  { name: 'Old encryption allowed', severity: 'low', why: 'An outdated encryption option is still accepted alongside the good ones.' },
  { name: 'Minor slowdown bug', severity: 'low', why: "Can slow the service down, but doesn't let anyone in." },
];
