import { ART, KINDS, PALETTE, type ItemKind } from './data';

/** Checks the art and the text at startup. Returns one message per problem; empty means all fine. */
export function validateContent(): string[] {
  const problems: string[] = [];
  for (const kind of Object.keys(KINDS) as ItemKind[]) {
    const info = KINDS[kind];
    if (!ART[kind]) problems.push(`${kind}: has no pixel art.`);
    if (!info.power && !info.lesson.trim()) problems.push(`${kind}: needs a lesson.`);
    if (!info.good && !info.power && !info.oops) problems.push(`${kind}: a threat needs its "got in" message.`);
    if (info.good && info.points <= 0) problems.push(`${kind}: a good file needs points.`);
  }
  for (const [name, rows] of Object.entries(ART)) {
    if (rows.some((row) => row.length !== rows[0].length)) problems.push(`${name}: pixel rows differ in width.`);
    for (const row of rows) {
      for (const ch of row) {
        if (ch !== '.' && !PALETTE[ch]) problems.push(`${name}: unknown pixel "${ch}".`);
      }
    }
  }
  return problems;
}
