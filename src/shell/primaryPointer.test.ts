import { describe, expect, it } from 'vitest';
import { claimPointer, ownsPointer, releasePointer, type PointerGate } from './primaryPointer';

describe('primaryPointer', () => {
  it('lets the first pointer claim and ignores a second one', () => {
    const gate: PointerGate = { current: null };
    expect(claimPointer(gate, 1)).toBe(true);
    expect(claimPointer(gate, 2)).toBe(false);
    expect(ownsPointer(gate, 1)).toBe(true);
    expect(ownsPointer(gate, 2)).toBe(false);
  });

  it('ignores the second pointer lifting, so it cannot end the first drag', () => {
    const gate: PointerGate = { current: null };
    claimPointer(gate, 1);
    expect(releasePointer(gate, 2)).toBe(false);
    expect(ownsPointer(gate, 1)).toBe(true);
  });

  it('frees the gate when the first pointer lifts or is cancelled', () => {
    const gate: PointerGate = { current: null };
    claimPointer(gate, 1);
    expect(releasePointer(gate, 1)).toBe(true);
    expect(ownsPointer(gate, 1)).toBe(false);
    expect(claimPointer(gate, 2)).toBe(true);
  });

  it('ignores moves when no pointer is down', () => {
    expect(ownsPointer({ current: null }, 1)).toBe(false);
  });
});
