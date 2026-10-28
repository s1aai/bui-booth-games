/**
 * The passwords, with how many guesses an attacker needs to reach each one (log10Guesses: 6 = a million).
 * The crack time shown is that divided by PASSWORD_CONFIG.guessesPerSecond. How each kind was worked out:
 * - common and pattern: zxcvbn's estimate (guesses_log10). An attacker tries leaked-password lists and their
 *   usual variations first. data.test.ts checks every one against zxcvbn.
 * - random: made by a password generator (a CSPRNG), so the attacker must try combinations:
 *   (characters to choose from ^ length) / 2, the average. The characters count by kind: 26 lowercase,
 *   26 uppercase, 10 digits and 32 symbols. (zxcvbn underrates random strings, so it isn't used for these.)
 * - passphrase: random words from EFF's long word list (7,776 words), and the attacker knows the list:
 *   7776 ^ words / 2. Every word here is on that list.
 * validate.ts recomputes the random and passphrase numbers at startup.
 */

export type PasswordKind = 'common' | 'pattern' | 'random' | 'passphrase';

export interface PasswordEntry {
  text: string;
  kind: PasswordKind;
  log10Guesses: number;
  /** Why it's weak or strong, in one sentence, for the "What you missed" page. */
  why: string;
}

export const PASSWORDS: PasswordEntry[] = [
  // Common: on every leaked-password list.
  { text: '123456', kind: 'common', log10Guesses: 0.3, why: "The most common password in the world, so it's the very first guess." },
  { text: 'password', kind: 'common', log10Guesses: 0.48, why: 'The second most common password. Attackers try it straight away.' },
  { text: 'football', kind: 'common', log10Guesses: 1.18, why: 'A top-20 leaked password: every cracking list has it.' },
  { text: 'iloveyou', kind: 'common', log10Guesses: 1.68, why: "Thousands of people chose it too, so it's near the top of every list." },
  { text: 'qwerty123', kind: 'common', log10Guesses: 2.34, why: 'A keyboard run plus 123: one of the most common passwords there is.' },
  { text: 'password123', kind: 'common', log10Guesses: 2.78, why: "Adding 123 doesn't help: it's one of the most common passwords of all." },
  { text: 'Liverpool1', kind: 'common', log10Guesses: 3.99, why: 'A favourite team with a 1 on the end is one of the first things tried.' },
  { text: 'letmein!', kind: 'common', log10Guesses: 4.05, why: 'A classic from every leaked list, with the ! most people add.' },
  { text: 'Welcome123', kind: 'common', log10Guesses: 4.29, why: "The classic first-day password. It's on every list." },

  // Pattern: a common word dressed up in the ways everyone does.
  { text: 'Password1!', kind: 'pattern', log10Guesses: 4.26, why: "Ticks every complexity rule, but it's still 'password' with the usual capital, digit and symbol." },
  { text: 'Qwerty!2345', kind: 'pattern', log10Guesses: 5.94, why: 'Keyboard runs look random, but cracking tools try them early.' },
  { text: 'Summer2026', kind: 'pattern', log10Guesses: 6.31, why: 'A season plus the year is one of the first patterns tried.' },
  { text: 'P@ssw0rd2026!', kind: 'pattern', log10Guesses: 7, why: 'Swapping letters for look-alike symbols fools nobody: cracking tools try it automatically.' },
  { text: 'Monkey!2025', kind: 'pattern', log10Guesses: 7, why: 'A common word, a symbol and a year: exactly the pattern cracking tools are built for.' },
  { text: 'Summer2026!', kind: 'pattern', log10Guesses: 7.44, why: 'An ! on the end is the most predictable symbol there is.' },
  { text: 'Fluffy2019!', kind: 'pattern', log10Guesses: 8.01, why: "A pet's name and a year: easy to guess, especially from social media." },

  // Random: from a password generator.
  { text: 'Bx7!q', kind: 'random', log10Guesses: 9.56, why: 'Random, but only 5 characters: few enough to try every one in under a second.' },
  { text: 'xqpvmtrk', kind: 'random', log10Guesses: 11.02, why: "Eight random lowercase letters: random helps, but it's still short." },
  { text: 'thdkmbzfwq', kind: 'random', log10Guesses: 13.85, why: 'Ten random lowercase letters. Each extra letter multiplies the work by 26.' },
  { text: 'hyEgVd8r', kind: 'random', log10Guesses: 14.04, why: "Eight random letters and digits: the mix helps, but it's still short." },
  { text: 'uhw{y6Ke', kind: 'random', log10Guesses: 15.48, why: 'Eight random characters of every kind: symbols help, but length helps more.' },
  { text: 'ewhdjyryjwqv', kind: 'random', log10Guesses: 16.68, why: 'Twelve random lowercase letters: length is starting to pay off.' },
  { text: 'ZwNq6GJ5GfyS', kind: 'random', log10Guesses: 21.21, why: 'Twelve random letters and digits, as a password manager might make.' },
  { text: 'qnwzkwavewblyfnr', kind: 'random', log10Guesses: 22.34, why: 'Sixteen random lowercase letters beat twelve with capitals and digits: length wins.' },
  { text: 'Q)]bF6(2?Gfz', kind: 'random', log10Guesses: 23.38, why: 'Twelve random characters of every kind, from a password manager.' },
  { text: 'Z#L#pq>FXkzf9[iC', kind: 'random', log10Guesses: 31.27, why: 'Sixteen random characters from a password manager: longer than the universe has existed.' },

  // Passphrase: random words.
  { text: 'velvet-otter-banjo', kind: 'passphrase', log10Guesses: 11.37, why: 'Three random words: easy to remember, but an attacker trying word combinations gets there fast.' },
  { text: 'purple-glacier-mug-ferret', kind: 'passphrase', log10Guesses: 15.26, why: 'Four random words: each extra word multiplies the work by 7,776.' },
  { text: 'harbor-tulip-anchor-crayon-oboe', kind: 'passphrase', log10Guesses: 19.15, why: 'Five random words: decades of guessing, and still easy to remember.' },
  { text: 'mango-bagel-quilt-igloo-yodel-donut', kind: 'passphrase', log10Guesses: 23.04, why: 'Six random words: hundreds of thousands of years, and you can still type it.' },
];
