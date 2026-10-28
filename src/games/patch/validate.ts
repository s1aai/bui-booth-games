import { SEVERITIES } from './config';
import type { Vulnerability } from './data';

/** The board is a 3 x 3 grid. */
const GRID = 9;
const MAX_SERVER = 12;
const MAX_NAME = 26;
const MAX_WHY = 120;

/** Checks the servers and vulnerabilities at startup. Returns one message per problem; empty means all fine. */
export function validatePatchContent(servers: readonly string[], vulnerabilities: readonly Vulnerability[]): string[] {
  const problems: string[] = [];
  if (servers.length !== GRID) problems.push(`There must be exactly ${GRID} servers (a 3 x 3 board), not ${servers.length}.`);
  if (new Set(servers).size !== servers.length) problems.push('Two servers have the same name.');
  for (const server of servers) {
    if (!server.trim() || server.length > MAX_SERVER) problems.push(`Server "${server}": the name must be 1-${MAX_SERVER} characters.`);
  }

  const names = new Set<string>();
  for (const v of vulnerabilities) {
    if (!v.name.trim() || v.name.length > MAX_NAME) problems.push(`"${v.name}": the name must be 1-${MAX_NAME} characters.`);
    if (names.has(v.name)) problems.push(`"${v.name}": listed twice.`);
    names.add(v.name);
    if (!SEVERITIES.includes(v.severity)) problems.push(`"${v.name}": unknown severity "${v.severity}".`);
    if (!v.why.trim() || v.why.length > MAX_WHY) problems.push(`"${v.name}": "why" must be 1-${MAX_WHY} characters.`);
  }
  for (const severity of SEVERITIES) {
    if (!vulnerabilities.some((v) => v.severity === severity)) problems.push(`No ${severity} vulnerabilities: add at least one.`);
  }
  return problems;
}
