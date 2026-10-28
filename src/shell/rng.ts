/** A function returning a float in [0, 1), like Math.random. Injectable so tests are deterministic. */
export type Rng = () => number;

/**
 * One step of mulberry32 as a pure function: the random number for `seed`, and the seed to use next.
 * For real-time reducers that keep their seed in state (Patch Panic), so the same seed and actions always
 * replay the same game.
 */
export function nextRandom(seed: number): [value: number, nextSeed: number] {
  const a = (seed + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** Small seeded PRNG (mulberry32). Same seed, same sequence. */
export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    const [value, next] = nextRandom(s);
    s = next;
    return value;
  };
}

/**
 * A seeded random source for a reducer: `next()` gives the next number, and `seed` is where it has got to, to be
 * stored back in state. The same seed always gives the same sequence.
 */
export function seededSource(seed: number) {
  let current = seed >>> 0;
  return {
    next(): number {
      const [value, next] = nextRandom(current);
      current = next;
      return value;
    },
    get seed(): number {
      return current;
    },
  };
}
