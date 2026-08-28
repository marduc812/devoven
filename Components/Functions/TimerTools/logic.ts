import { formatDuration } from '../TimerShared/duration';

export type Lap = {
  index: number;
  /** Time since the previous lap. */
  splitMs: number;
  /** Total elapsed time when the lap was taken. */
  totalMs: number;
};

/** Builds the next lap entry from the existing laps and the elapsed time. */
export function buildLap(laps: Lap[], totalMs: number): Lap {
  const previousTotal = laps.length > 0 ? laps[laps.length - 1].totalMs : 0;
  return {
    index: laps.length + 1,
    splitMs: Math.max(0, totalMs - previousTotal),
    totalMs,
  };
}

export function formatLap(lap: Lap): { label: string; split: string; total: string } {
  return {
    label: `Lap ${lap.index}`,
    split: formatDuration(lap.splitMs),
    total: formatDuration(lap.totalMs),
  };
}
