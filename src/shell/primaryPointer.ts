/**
 * Drag games follow only the first finger: it is "claimed" on pointerdown, and every other pointer is ignored
 * until that one lifts or is cancelled. The gate is just the claimed pointerId (null = free), kept in a ref.
 */
export type PointerGate = { current: number | null };

/** True (and claims the gate) if no finger is down yet. */
export function claimPointer(gate: PointerGate, pointerId: number): boolean {
  if (gate.current !== null) return false;
  gate.current = pointerId;
  return true;
}

/** True if this pointer is the claimed finger. */
export function ownsPointer(gate: PointerGate, pointerId: number): boolean {
  return gate.current === pointerId;
}

/** Frees the gate if this pointer owns it; true if it did. */
export function releasePointer(gate: PointerGate, pointerId: number): boolean {
  if (gate.current !== pointerId) return false;
  gate.current = null;
  return true;
}
