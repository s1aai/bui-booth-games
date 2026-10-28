import { ART, GUESSES, LESSONS, PALETTE, TYPES, TYPE_ORDER, WEAK } from './data';

/** Checks the art and the text at startup. Returns one message per problem; empty means all fine. */
export function validateContent(): string[] {
  const problems: string[] = [];
  for (const type of TYPE_ORDER) {
    const { chars, label } = TYPES[type];
    if (!chars) problems.push(`${type}: has no characters to pick from.`);
    if (new Set(chars).size !== chars.length) problems.push(`${type}: repeats a character.`);
    if (!label.trim()) problems.push(`${type}: needs a chip label.`);
  }
  for (const [name, rows] of Object.entries(ART)) {
    if (rows.some((row) => row.length !== rows[0].length)) problems.push(`${name}: pixel rows differ in width.`);
    for (const row of rows) {
      for (const ch of row) {
        if (ch !== '.' && !PALETTE[ch]) problems.push(`${name}: unknown pixel "${ch}".`);
      }
    }
  }
  if (WEAK.length === 0) problems.push('There are no weak words.');
  if (GUESSES.length === 0) problems.push('There are no bot guesses.');
  for (const [kind, lesson] of Object.entries(LESSONS)) {
    if (!lesson.title.trim() || !lesson.text.trim()) problems.push(`${kind}: needs a lesson title and text.`);
  }
  return problems;
}
