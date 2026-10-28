import { describe, expect, it } from 'vitest';
import { SHELL_CONFIG } from './config';
import { appendDigit, backspace, checkPin, isLocked, NO_LOCK, recordFailure, type PinConfig } from './adminPin';

const cfg: PinConfig = { pin: '2468', maxTries: 3, lockoutMs: 30_000 };

describe('adminPin', () => {
  it('appends digits up to the PIN length and ignores anything else', () => {
    let entry = '';
    for (const d of '24x68') entry = appendDigit(entry, d, 4);
    expect(entry).toBe('2468');
    expect(appendDigit(entry, '1', 4)).toBe('2468');
    expect(appendDigit('', '12', 4)).toBe('');
  });

  it('backspace removes the last digit and is safe on empty', () => {
    expect(backspace('24')).toBe('2');
    expect(backspace('')).toBe('');
  });

  it('checkPin waits for a full-length entry, then says ok or wrong', () => {
    expect(checkPin('', cfg.pin)).toBe('incomplete');
    expect(checkPin('246', cfg.pin)).toBe('incomplete');
    expect(checkPin('2468', cfg.pin)).toBe('ok');
    expect(checkPin('2469', cfg.pin)).toBe('wrong');
  });

  it('locks out on the third wrong PIN, for lockoutMs, then counts afresh', () => {
    let lock = recordFailure(NO_LOCK, 1000, cfg);
    lock = recordFailure(lock, 2000, cfg);
    expect(isLocked(lock, 2000)).toBe(false);
    lock = recordFailure(lock, 3000, cfg);
    expect(isLocked(lock, 3000)).toBe(true);
    expect(isLocked(lock, 32_999)).toBe(true);
    expect(isLocked(lock, 33_000)).toBe(false);
    expect(lock.failures).toBe(0);
  });

  it('the shipped config has a digits-only PIN and sane limits', () => {
    expect(SHELL_CONFIG.admin.pin).toMatch(/^[0-9]{4,8}$/);
    expect(SHELL_CONFIG.admin.maxTries).toBeGreaterThanOrEqual(1);
    expect(SHELL_CONFIG.admin.lockoutMs).toBeGreaterThan(0);
  });
});
