import { useEffect, useRef } from 'react';

// scroll: a touch-scroll through the review fires no pointer events once the browser takes over the pan.
const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll'] as const;

/** Calls onIdle once nobody has touched, clicked, moved the mouse, scrolled or pressed a key for `ms`, while enabled. */
export function useIdleReset(enabled: boolean, ms: number, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    if (!enabled) return;
    const fire = () => onIdleRef.current();
    let id = window.setTimeout(fire, ms);
    const restart = () => {
      window.clearTimeout(id);
      id = window.setTimeout(fire, ms);
    };
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, restart, { passive: true });
    return () => {
      window.clearTimeout(id);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, restart);
    };
  }, [enabled, ms]);
}
