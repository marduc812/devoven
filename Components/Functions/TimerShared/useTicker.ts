'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 100;

export type TickerDirection = 'down' | 'up';

export type Ticker = {
  /** Remaining ms when counting down, elapsed ms when counting up. */
  valueMs: number;
  running: boolean;
  start: () => void;
  pause: () => void;
  /** Stops and sets the value, e.g. back to the configured duration. */
  reset: (valueMs: number) => void;
};

/**
 * Drift-free timing engine shared by the timer and pomodoro tools.
 *
 * Browsers throttle intervals in background tabs, so accumulating elapsed time
 * per tick loses real time. Instead we anchor to a wall-clock timestamp on
 * start and let each tick merely *read* Date.now(). A backgrounded tab is
 * therefore correct the moment it repaints, regardless of throttling.
 */
export function useTicker(
  initialMs: number,
  direction: TickerDirection,
  onComplete?: () => void,
): Ticker {
  const [valueMs, setValueMs] = useState(initialMs);
  const [running, setRunning] = useState(false);

  // Countdown: timestamp at which we hit zero. Stopwatch: timestamp of start.
  const anchorRef = useRef<number | null>(null);
  const valueRef = useRef(initialMs);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const setValue = useCallback((next: number) => {
    valueRef.current = next;
    setValueMs(next);
  }, []);

  const start = useCallback(() => {
    if (anchorRef.current !== null) return;
    if (direction === 'down' && valueRef.current <= 0) return;

    anchorRef.current = direction === 'down'
      ? Date.now() + valueRef.current
      : Date.now() - valueRef.current;
    setRunning(true);
  }, [direction]);

  const pause = useCallback(() => {
    anchorRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback((next: number) => {
    anchorRef.current = null;
    setRunning(false);
    setValue(next);
  }, [setValue]);

  useEffect(() => {
    if (!running) return;

    const id = setInterval(() => {
      const anchor = anchorRef.current;
      if (anchor === null) return;

      if (direction === 'down') {
        const remaining = anchor - Date.now();
        if (remaining <= 0) {
          anchorRef.current = null;
          setValue(0);
          setRunning(false);
          onCompleteRef.current?.();
        } else {
          setValue(remaining);
        }
      } else {
        setValue(Date.now() - anchor);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [running, direction, setValue]);

  return { valueMs, running, start, pause, reset };
}
