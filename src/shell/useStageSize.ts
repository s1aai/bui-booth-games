import { useLayoutEffect, useState, type RefObject } from 'react';

export interface StageSize {
  width: number;
  height: number;
}

/** What a canvas game draws on: the stage's CSS size, and screen pixels per CSS pixel (from fitCanvas). */
export interface View extends StageSize {
  dpr: number;
}

/**
 * For the canvas games: the CSS size of the room the game has, measured before the first paint and again whenever it
 * changes (a resized window, a turned phone). Null until the element is on the page.
 */
export function useStageSize(ref: RefObject<HTMLElement | null>): StageSize | null {
  const [size, setSize] = useState<StageSize | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const width = el.clientWidth;
      const height = el.clientHeight;
      setSize((old) => (old && old.width === width && old.height === height ? old : { width, height }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * Gives a canvas one pixel for each screen pixel of its CSS size, so the drawing is sharp, and returns the ratio to
 * scale the drawing by. Setting a canvas's size clears it, so the size is only set when it changes.
 */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number): number {
  const ratio = window.devicePixelRatio || 1;
  const w = Math.round(width * ratio);
  const h = Math.round(height * ratio);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  return ratio;
}
