/** Pure PIN logic for the admin panel's keypad. The component keeps the state; nothing here touches the browser. */

export interface PinConfig {
  /** The correct PIN: digits only. */
  pin: string;
  /** Wrong PINs in a row before the keypad is locked out. */
  maxTries: number;
  /** How long the lockout lasts, in ms. */
  lockoutMs: number;
}

export interface PinLock {
  /** Wrong PINs since the last right one or the last lockout. */
  failures: number;
  /** Timestamp (ms) the lockout ends; 0 when there is none. */
  lockedUntil: number;
}

export const NO_LOCK: PinLock = { failures: 0, lockedUntil: 0 };

/** Adds a digit, ignoring anything that isn't 0-9 and anything past the PIN's length. */
export function appendDigit(entry: string, digit: string, pinLength: number): string {
  return /^[0-9]$/.test(digit) && entry.length < pinLength ? entry + digit : entry;
}

export function backspace(entry: string): string {
  return entry.slice(0, -1);
}

/** 'incomplete' until as many digits as the PIN has are entered, then 'ok' or 'wrong'. */
export function checkPin(entry: string, pin: string): 'incomplete' | 'ok' | 'wrong' {
  if (entry.length < pin.length) return 'incomplete';
  return entry === pin ? 'ok' : 'wrong';
}

export function isLocked(lock: PinLock, now: number): boolean {
  return now < lock.lockedUntil;
}

/** Counts a wrong PIN; the maxTries-th one in a row starts the lockout and resets the count. */
export function recordFailure(lock: PinLock, now: number, cfg: PinConfig): PinLock {
  const failures = lock.failures + 1;
  return failures >= cfg.maxTries ? { failures: 0, lockedUntil: now + cfg.lockoutMs } : { ...lock, failures };
}
