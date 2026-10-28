/**
 * What can be in the machine: the compromised system you're recovering from. Good items score; restoring a bad one
 * with `strike` is a strike. The infected backup deliberately looks like a clean one, apart from its bug badge.
 * `weights` sets how often each kind drops in, before and after CLAW_CONFIG.levelUpMs. validate.ts checks the list.
 */
export type ItemId = 'backup' | 'key' | 'cert' | 'malware' | 'infected' | 'locked' | 'corrupt';

export interface ItemKind {
  id: ItemId;
  /** Under the item in the machine. */
  label: string;
  /** In messages and on the lessons page. */
  name: string;
  good: boolean;
  /** Points for restoring it (good items only). */
  points: number;
  /** Restoring it is a strike. */
  strike: boolean;
  /** How often it drops in: [first part of the round, the rest]. 0 = never. */
  weights: [number, number];
  /** Why it matters, in a sentence, for the lessons page. */
  why: string;
}

export const ITEMS: ItemKind[] = [
  {
    id: 'backup',
    label: 'Backup',
    name: 'Clean backup',
    good: true,
    points: 100,
    strike: false,
    weights: [3, 2],
    why: 'A clean backup gets the business running again, without paying anyone.',
  },
  {
    id: 'key',
    label: 'Key',
    name: 'Encryption key',
    good: true,
    points: 150,
    strike: false,
    weights: [2, 2],
    why: 'You need your encryption keys to unlock your own encrypted backups and data.',
  },
  {
    id: 'cert',
    label: 'Certificate',
    name: 'Certificate',
    good: true,
    points: 150,
    strike: false,
    weights: [2, 2],
    why: 'Certificates prove your servers are really yours. Without them, rebuilding means outages and warnings.',
  },
  {
    id: 'malware',
    label: 'Malware',
    name: 'Malware',
    good: false,
    points: 0,
    strike: true,
    weights: [3, 2],
    why: 'Restoring malware reinfects the system you just cleaned.',
  },
  {
    id: 'infected',
    label: 'Backup',
    name: 'Infected backup',
    good: false,
    points: 0,
    strike: true,
    weights: [0, 2],
    why: 'A backup taken after the attack began carries the malware with it. Scan backups, and restore from before the attack.',
  },
  {
    id: 'locked',
    label: 'files.locked',
    name: 'Ransomware-locked files',
    good: false,
    points: 0,
    strike: true,
    weights: [0, 2],
    why: "Scrambled by the attacker, so useless without their key. Restore a clean backup instead of paying.",
  },
  {
    id: 'corrupt',
    label: 'Corrupt',
    name: 'Corrupted file',
    good: false,
    points: 0,
    strike: false,
    weights: [1, 1],
    why: "It won't open. Test your backups regularly, so you find this out before a crisis.",
  },
];
