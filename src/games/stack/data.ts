import type { IconName } from '../../shell/components/Icon';

/**
 * The blocks you can stack. The rules (logic.ts) go by role:
 * - data: must be covered by a protect block, or it's exposed to the internet above (a strike);
 * - service: faces the internet by design; protecting it scores a bonus;
 * - protect: covering data or a service scores a bonus, and two different ones together are defence in depth.
 * validate.ts checks the list at startup.
 */
export type BlockRole = 'data' | 'service' | 'protect';

export interface BlockKind {
  id: 'database' | 'web' | 'firewall' | 'login';
  label: string;
  icon: IconName;
  role: BlockRole;
  /** Points for placing it: valuable things score more, which is the temptation. */
  points: number;
  /** How often it's offered, relative to the others. */
  weight: number;
}

export const BLOCKS: BlockKind[] = [
  { id: 'database', label: 'Database', icon: 'database', role: 'data', points: 100, weight: 3 },
  { id: 'web', label: 'Web server', icon: 'server', role: 'service', points: 60, weight: 3 },
  { id: 'firewall', label: 'Firewall', icon: 'firewall', role: 'protect', points: 20, weight: 2 },
  { id: 'login', label: 'Login + MFA', icon: 'lock', role: 'protect', points: 20, weight: 2 },
];
