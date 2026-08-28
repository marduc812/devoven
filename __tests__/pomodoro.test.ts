import {
  DEFAULT_SETTINGS,
  INITIAL_STATE,
  nextPhase,
  phaseDurationMs,
  type PomodoroState,
} from '@/Components/Functions/PomodoroTools/logic';

/** Runs the cycle forward and records the phase after each transition. */
const walk = (steps: number, settings = DEFAULT_SETTINGS) => {
  let state: PomodoroState = INITIAL_STATE;
  const phases: string[] = [];
  for (let i = 0; i < steps; i++) {
    state = nextPhase(state, settings);
    phases.push(state.phase);
  }
  return { state, phases };
};

describe('nextPhase', () => {
  it('alternates work and short breaks within a cycle', () => {
    const { phases } = walk(6);
    expect(phases.slice(0, 6)).toEqual([
      'short-break', 'work',
      'short-break', 'work',
      'short-break', 'work',
    ]);
  });

  it('takes a long break after the configured number of rounds', () => {
    const { phases, state } = walk(7);
    expect(phases[6]).toBe('long-break');
    expect(state.round).toBe(4);
    expect(state.completedWork).toBe(4);
  });

  it('rolls the round counter over after a long break', () => {
    const { state } = walk(8);
    expect(state).toEqual({ phase: 'work', round: 1, completedWork: 4 });
  });

  it('honours a custom rounds-per-cycle setting', () => {
    const settings = { ...DEFAULT_SETTINGS, roundsBeforeLongBreak: 2 };
    const { phases } = walk(3, settings);
    expect(phases).toEqual(['short-break', 'work', 'long-break']);
  });

  it('treats a rounds-per-cycle of 1 as a long break every round', () => {
    const settings = { ...DEFAULT_SETTINGS, roundsBeforeLongBreak: 1 };
    const { phases } = walk(2, settings);
    expect(phases).toEqual(['long-break', 'work']);
  });

  it('counts only work blocks as completed', () => {
    const { state } = walk(2);
    expect(state.completedWork).toBe(1);
  });
});

describe('phaseDurationMs', () => {
  it('maps each phase to its configured duration', () => {
    expect(phaseDurationMs('work', DEFAULT_SETTINGS)).toBe(1500000);
    expect(phaseDurationMs('short-break', DEFAULT_SETTINGS)).toBe(300000);
    expect(phaseDurationMs('long-break', DEFAULT_SETTINGS)).toBe(900000);
  });

  it('floors a zero or negative setting at one minute', () => {
    expect(phaseDurationMs('work', { ...DEFAULT_SETTINGS, workMinutes: 0 })).toBe(60000);
  });
});
