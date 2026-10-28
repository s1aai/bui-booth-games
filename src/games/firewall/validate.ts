import type { FileItem } from './data';

/** Longest file name that fits a falling card. */
const MAX_NAME = 20;
const MAX_WHY = 120;
/** Each difficulty needs this many dangerous and this many safe files, so every level has variety. */
const MIN_PER_KIND = 3;

/** Checks the file list at startup. Returns one message per problem; empty means all fine. */
export function validateFiles(files: readonly FileItem[]): string[] {
  const problems: string[] = [];
  const names = new Set<string>();
  for (const file of files) {
    const name = `"${file.name}"`;
    if (!/^[\w.-]+\.[a-z0-9]+$/i.test(file.name)) problems.push(`${name}: not a file name with an extension.`);
    if (file.name.length > MAX_NAME) problems.push(`${name}: longer than ${MAX_NAME} characters.`);
    if (names.has(file.name.toLowerCase())) problems.push(`${name}: listed twice.`);
    names.add(file.name.toLowerCase());
    if (![1, 2, 3].includes(file.difficulty)) problems.push(`${name}: difficulty must be 1, 2 or 3.`);
    if (!file.why.trim() || file.why.length > MAX_WHY) problems.push(`${name}: "why" must be 1-${MAX_WHY} characters.`);
  }
  for (const difficulty of [1, 2, 3]) {
    for (const dangerous of [true, false]) {
      const count = files.filter((f) => f.difficulty === difficulty && f.dangerous === dangerous).length;
      if (count < MIN_PER_KIND) {
        problems.push(`Difficulty ${difficulty} needs at least ${MIN_PER_KIND} ${dangerous ? 'dangerous' : 'safe'} files (has ${count}).`);
      }
    }
  }
  return problems;
}
