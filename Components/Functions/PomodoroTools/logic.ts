export type Phase = 'work' | 'short-break' | 'long-break';

export type PomodoroSettings = {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  /** Work blocks completed before a long break is taken. */
  roundsBeforeLongBreak: number;
};

export type PomodoroState = {
  phase: Phase;
  /** 1-based work block currently in progress or just finished. */
  round: number;
  /** Work blocks completed since the page loaded. */
  completedWork: number;
};

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4,
};

export const INITIAL_STATE: PomodoroState = {
  phase: 'work',
  round: 1,
  completedWork: 0,
};

export const PHASE_LABELS: Record<Phase, string> = {
  work: 'Work',
  'short-break': 'Short break',
  'long-break': 'Long break',
};

/**
 * Advances the cycle. A work block leads into a long break every
 * `roundsBeforeLongBreak` rounds and a short break otherwise; any break leads
 * back into work, rolling the round counter over after a long break.
 */
export function nextPhase(state: PomodoroState, settings: PomodoroSettings): PomodoroState {
  const perCycle = Math.max(1, settings.roundsBeforeLongBreak);

  if (state.phase === 'work') {
    const completedWork = state.completedWork + 1;
    return {
      phase: state.round >= perCycle ? 'long-break' : 'short-break',
      round: state.round,
      completedWork,
    };
  }

  return {
    phase: 'work',
    round: state.phase === 'long-break' ? 1 : state.round + 1,
    completedWork: state.completedWork,
  };
}

export function phaseDurationMs(phase: Phase, settings: PomodoroSettings): number {
  const minutes =
    phase === 'work' ? settings.workMinutes
      : phase === 'short-break' ? settings.shortBreakMinutes
        : settings.longBreakMinutes;

  return Math.max(1, minutes) * 60000;
}
