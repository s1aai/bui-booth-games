import { useEffect, useRef } from 'react';

/**
 * For real-time games: calls onTick with the ms since the last screen frame, once per frame, while `running`.
 * The games' reducers cap each step, so a stalled window can't leap ahead.
 */
export function useFrameClock(running: boolean, onTick: (ms: number) => void): void {
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onTickRef.current = onTick;
  });

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let id = requestAnimationFrame(function frame(now) {
      onTickRef.current(now - last);
      last = now;
      id = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(id);
  }, [running]);
}
