/** The four kinds of character. `size` is how many of them there are to pick from, for the crack maths. */
export type CharType = 'lower' | 'upper' | 'digit' | 'symbol';

export interface TypeInfo {
  size: number;
  chars: string;
  /** Colour on the board, and the short label on the kind chips. */
  color: string;
  label: string;
}

export const TYPES: Record<CharType, TypeInfo> = {
  lower: { size: 26, chars: 'abcdefghijkmnopqrstuvwxyz', color: '--game-info', label: 'abc' },
  upper: { size: 26, chars: 'ABCDEFGHJKLMNPQRSTUVWXYZ', color: '--game-accent-light', label: 'ABC' },
  digit: { size: 10, chars: '23456789', color: '--game-good', label: '123' },
  symbol: { size: 33, chars: '!@#$%&?*+=', color: '--game-pink', label: '#$!' },
};

export const TYPE_ORDER: CharType[] = ['lower', 'upper', 'digit', 'symbol'];

/** Weak words: eating one costs a life and chops the password. */
export const WEAK: string[] = ['123456', 'password', 'qwerty', 'abc123', '111111', 'letmein', 'iloveyou', 'admin', '000000', 'pa55word'];

/** What the guess-bots say they're trying, shown over them. */
export const GUESSES: string[] = ['1234?', 'abcd?', 'pass?', '0000?', 'qwer?', 'admin?', 'hello?'];

/** What the lessons page says about each kind of mistake. */
export const LESSONS = {
  weak: {
    title: 'You ate a weak word',
    text: 'Weak words like 123456 and password are the first thing hackers try. Never use them.',
  },
  bot: {
    title: 'A guess-bot cracked you',
    text: 'Bots try common patterns first. Length and a mix of all four kinds makes them give up.',
  },
};

/** The colours the canvas uses for everything that isn't a kind of character. */
export const PALETTE: Record<string, string> = {
  R: '--game-danger',
  r: '--game-danger-soft',
  k: '--game-board',
  w: '--game-paper',
  C: '--game-info',
  Y: '--game-accent-light',
  B: '--game-info-deep',
  G: '--game-good',
  S: '--game-mist',
  D: '--game-accent-dark',
};

/** Pixel sprites for the bot and the power-ups. One letter per pixel, looked up in PALETTE. */
export const ART: Record<'bot' | 'mfa' | 'vault' | 'backup', string[]> = {
  bot: ['...rr...', '..RRRR..', '.RRRRRR.', 'RRwkRwkR', 'RRRRRRRR', '.RkkkkR.', '.RRRRRR.', 'R.R..R.R'],
  mfa: ['........', '.CCC....', 'CC.CC...', 'CC.CCCCC', '.CCC..CC', '......C.'],
  vault: ['YYYYYYYY', 'YDDDDDDY', 'YDYYYYDY', 'YDYkkYDY', 'YDYkkYDY', 'YDYYYYDY', 'YDDDDDDY', 'YYYYYYYY'],
  backup: ['BBBBBBB.', 'BBwwwBBB', 'BBwwwBBB', 'BBBBBBBB', 'BBkkkkBB', 'BBkkkkBB', 'BBBBBBBB'],
};

export const POWER_LABELS = { mfa: 'MFA', vault: 'VAULT', backup: 'BACKUP' } as const;
