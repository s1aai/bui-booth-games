import { BYTE_GUARD_CONFIG as cfg } from './config';

/** What falls from the internet. Good files are caught; threats are zapped; power-ups are caught for their effect. */
export type ItemKind =
  | 'email'
  | 'photo'
  | 'game'
  | 'homework'
  | 'virus'
  | 'phish'
  | 'thief'
  | 'locker'
  | 'patch'
  | 'mfa'
  | 'backup';

/** A score or warning colour, named so the logic stays free of drawing. Draw.ts turns it into a colour. */
export type Tone = 'gold' | 'red' | 'cyan' | 'green' | 'magenta' | 'pale' | 'orange';

export interface KindInfo {
  tag: string;
  /** A good file: catch it. Anything else that isn't a power-up is a threat: zap it. */
  good: boolean;
  power: boolean;
  /** Points for catching or zapping it, before the combo multiplier. */
  points: number;
  /** Shown on the power-up when caught. */
  info?: string;
  /** Shown when a threat reaches the server. */
  oops?: string;
  /** The lesson when the player misses it, or zaps a friend. */
  lesson: string;
}

export const KINDS: Record<ItemKind, KindInfo> = {
  email: { good: true, power: false, tag: 'EMAIL', points: 10, lesson: 'Email is fine, but a message that rushes you can be a trap.' },
  photo: { good: true, power: false, tag: 'PHOTO', points: 10, lesson: 'Photos are safe, but only open files you were expecting.' },
  game: { good: true, power: false, tag: 'GAME SAVE', points: 10, lesson: 'Game saves are harmless. Programs and scripts are what to watch.' },
  homework: { good: true, power: false, tag: 'HOMEWORK', points: 10, lesson: 'Documents are fine. Only a program or script should be blocked.' },
  virus: {
    good: false,
    power: false,
    tag: 'VIRUS',
    points: 25,
    oops: 'A virus got in!',
    lesson: 'Viruses are sneaky programs. Antivirus and updates zap them.',
  },
  phish: {
    good: false,
    power: false,
    tag: 'PHISHING',
    points: 30,
    oops: 'You took the phishing bait!',
    lesson: 'Phishing is a fake message pretending to be someone you trust. Check who really sent it.',
  },
  thief: {
    good: false,
    power: false,
    tag: 'PASSWORD THIEF',
    points: 30,
    oops: 'A thief grabbed a password!',
    lesson: 'Password thieves want the passwords you reuse. Use a long, different one for each account.',
  },
  locker: {
    good: false,
    power: false,
    tag: 'RANSOMWARE',
    points: 40,
    oops: 'Ransomware locked a file!',
    lesson: 'Ransomware locks your files and asks for money. A backup is a spare copy that saves the day.',
  },
  patch: { good: false, power: true, tag: 'UPDATE', points: 0, info: 'Slow-mo!', lesson: '' },
  mfa: { good: false, power: true, tag: 'MFA KEY', points: 0, info: 'Shield up!', lesson: '' },
  backup: { good: false, power: true, tag: 'BACKUP', points: 0, info: '+1 heart', lesson: '' },
};

export const GOOD_KINDS: ItemKind[] = ['email', 'photo', 'game', 'homework'];
export const POWER_KINDS: ItemKind[] = ['patch', 'mfa', 'backup'];

/** The threats that can fall this many seconds into a run. More join as it goes on. */
export function threatPool(time: number): ItemKind[] {
  const pool: ItemKind[] = ['virus', 'virus', 'phish'];
  if (time >= cfg.thiefFromSeconds) pool.push('thief');
  if (time >= cfg.lockerFromSeconds) pool.push('locker', 'phish');
  return pool;
}

/** The colour of each tone on the screen. */
export const TONES: Record<Tone, string> = {
  gold: '--game-accent-light',
  red: '--game-danger',
  cyan: '--game-info',
  green: '--game-good',
  magenta: '--game-pink',
  pale: '--game-mist',
  orange: '--game-accent',
};

/** Pixel art: one letter per pixel, looked up in PALETTE. A dot is empty. */
export const PALETTE: Record<string, string> = {
  Y: '--game-accent-light',
  w: '--game-paper',
  D: '--game-accent-dark',
  C: '--game-info',
  b: '--game-info-deep',
  G: '--game-good',
  P: '--game-violet',
  r: '--game-danger',
  g: '--game-good',
  M: '--game-pink',
  k: '--game-slate',
  S: '--game-mist',
  O: '--game-accent',
  s: '--game-skin',
  R: '--game-danger',
  B: '--game-info',
  T: '--game-band',
  c: '--game-info-soft',
};

export const ART: Record<ItemKind | 'guard', string[]> = {
  email: ['..........', 'YYYYYYYYYY', 'YDwwwwwwDY', 'YwDwwwwDwY', 'YwwDwwDwwY', 'YwwwDDwwwY', 'YwwwwwwwwY', 'YYYYYYYYYY'],
  photo: ['CCCCCCCCCC', 'CbbbbbbYYC', 'CbbbbbbYYC', 'CbbbGbbbbC', 'CbbGGGbbbC', 'CbGGGGGbGC', 'CGGGGGGGGC', 'CCCCCCCCCC'],
  game: ['.PPPPPPPP.', 'PPwPPPPrPP', 'PwwwPPrPgP', 'PPwPPPPgPP', 'PPPPPPPPPP', 'PPP....PPP'],
  homework: ['wwwwwww...', 'wDDDDwwww.', 'wwwwwwwwww', 'wDDDDDDDDw', 'wwwwwwwwww', 'wDDDDDDDDw', 'wwwwwwwwww', 'wDDDDDwwww', 'wwwwwwwwww'],
  virus: ['M...MM...M', '.M.MMMM.M.', '..MMMMMM..', '.MMwMMwMM.', 'MMMkMMkMMM', 'MMMMMMMMMM', '.MMkkkkMM.', '..MMMMMM..', '.M.MMMM.M.', 'M...MM...M'],
  phish: ['....SS....', '...S..S...', '......S...', 'OOOOOSOOOO', 'OkwwwSwwkO', 'OwkwwSwkwO', 'OwwkSSkwwO', 'OwwwkkwwwO', 'OOOOOOOOOO'],
  thief: ['..kkkkkk..', '.kkkkkkkk.', '.ssssssss.', 'kkkkkkkkkk', 'kkrkkkkrkk', 'kkkkkkkkkk', '.ssssssss.', '.sskkkkss.', '..ssssss..'],
  locker: ['...RRRR...', '..R....R..', '..R....R..', 'RRRRRRRRRR', 'RRRRkkRRRR', 'RRRkkkkRRR', 'RRRRkkRRRR', 'RRRRkkRRRR', 'RRRRRRRRRR'],
  patch: ['.gg....gg.', '.gg....gg.', '.gggggggg.', '..gggggg..', '....gg....', '....gg....', '....gg....', '...gggg...', '...gggg...'],
  mfa: ['..........', '.CCC......', 'CC.CC.....', 'CC.CCCCCCC', '.CCC...C.C', '.......C.C'],
  backup: ['BBBBBBBBB.', 'BBwwwwwBBB', 'BBwwwwwBBB', 'BBBBBBBBBB', 'BBkkkkkkBB', 'BBkkkkkkBB', 'BBBBBBBBBB'],
  guard: [
    '......CCCC......',
    '....CCCCCCCC....',
    '...CCccCCccCC...',
    '..CCCkcCCkcCCC..',
    '.CCCCCCCCCCCCCC.',
    'CCCCCkkkkkkCCCCC',
    'CCTTCCCCCCCCTTCC',
    '.TT..........TT.',
  ],
};

/** Each sprite's pixel size on the screen: Guardie is drawn bigger than the items. */
export function artScale(key: ItemKind | 'guard'): number {
  return key === 'guard' ? 4 : 3;
}

/** The size of an item on the screen, in game units. */
export function itemSize(kind: ItemKind): { w: number; h: number } {
  const rows = ART[kind];
  return { w: rows[0].length * artScale(kind), h: rows.length * artScale(kind) };
}
