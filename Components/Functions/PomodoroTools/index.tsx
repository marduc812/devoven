'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { formatDuration } from '../TimerShared/duration';
import { useTicker } from '../TimerShared/useTicker';
import { loadSoundPreference, playBeep, saveSoundPreference } from '../TimerShared/beep';
import {
  DEFAULT_SETTINGS,
  INITIAL_STATE,
  PHASE_LABELS,
  nextPhase,
  phaseDurationMs,
  type PomodoroSettings,
  type PomodoroState,
} from './logic';

const SETTINGS_STORAGE_KEY = 'devoven-pomodoro-settings';

const btnPrimary =
  'px-5 py-2 border border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors duration-200 cursor-pointer';
const btnSecondary =
  'px-5 py-2 border border-gray-300 bg-white text-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 cursor-pointer';
const numberInput =
  'bg-white text-gray-900 p-2 w-20 border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm text-center';

const SETTING_FIELDS: { key: keyof PomodoroSettings; label: string; max: number }[] = [
  { key: 'workMinutes', label: 'Work (min)', max: 180 },
  { key: 'shortBreakMinutes', label: 'Short break (min)', max: 60 },
  { key: 'longBreakMinutes', label: 'Long break (min)', max: 60 },
  { key: 'roundsBeforeLongBreak', label: 'Rounds per cycle', max: 12 },
];

function loadSettings(): PomodoroSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>;
    return {
      workMinutes: Number(parsed.workMinutes) || DEFAULT_SETTINGS.workMinutes,
      shortBreakMinutes: Number(parsed.shortBreakMinutes) || DEFAULT_SETTINGS.shortBreakMinutes,
      longBreakMinutes: Number(parsed.longBreakMinutes) || DEFAULT_SETTINGS.longBreakMinutes,
      roundsBeforeLongBreak: Number(parsed.roundsBeforeLongBreak) || DEFAULT_SETTINGS.roundsBeforeLongBreak,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const Pomodoro = () => {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [state, setState] = useState<PomodoroState>(INITIAL_STATE);
  const [soundOn, setSoundOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // The completion handler needs the latest values without being re-created on
  // every phase change, which would restart the ticker's effect mid-run.
  const stateRef = useRef(state);
  const settingsRef = useRef(settings);
  stateRef.current = state;
  settingsRef.current = settings;

  const advanceRef = useRef<((autoStart: boolean) => void) | null>(null);

  const handleComplete = useCallback(() => {
    if (loadSoundPreference()) playBeep();
    advanceRef.current?.(true);
  }, []);

  const ticker = useTicker(phaseDurationMs('work', DEFAULT_SETTINGS), 'down', handleComplete);
  const { reset, start } = ticker;

  const advance = useCallback((autoStart: boolean) => {
    const next = nextPhase(stateRef.current, settingsRef.current);
    setState(next);
    reset(phaseDurationMs(next.phase, settingsRef.current));
    if (autoStart) start();
  }, [reset, start]);

  advanceRef.current = advance;

  useEffect(() => {
    setSoundOn(loadSoundPreference());
    const stored = loadSettings();
    setSettings(stored);
    reset(phaseDurationMs('work', stored));
  }, [reset]);

  const updateSetting = (key: keyof PomodoroSettings, raw: string) => {
    const field = SETTING_FIELDS.find(f => f.key === key);
    const value = Math.max(1, Math.min(field?.max ?? 180, parseInt(raw, 10) || 1));
    const next = { ...settings, [key]: value };
    setSettings(next);
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable — settings apply for this session only.
    }
    // Re-arm the current phase so an edit takes effect immediately.
    if (!ticker.running) reset(phaseDurationMs(state.phase, next));
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    saveSoundPreference(next);
  };

  const resetCycle = () => {
    setState(INITIAL_STATE);
    reset(phaseDurationMs('work', settings));
  };

  const phaseAccent = state.phase === 'work'
    ? 'border-gray-900 bg-gray-50'
    : 'border-emerald-500 bg-emerald-50';

  return (
    <Panel
      title="Pomodoro Timer"
      description="Work in focused blocks with automatic breaks. Defaults to [1 25 2] minutes of work, [1 5 2] minute short breaks and a [1 15 2] minute long break every fourth round. Durations are saved in your browser."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-900 border border-gray-900 px-2 py-1">
                {PHASE_LABELS[state.phase]}
              </span>
              <span className="text-xs text-gray-500">
                Round {state.round} of {settings.roundsBeforeLongBreak}
              </span>
            </div>
            <button
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
              onClick={toggleSound}
              aria-pressed={soundOn}
            >
              {soundOn ? '🔊 Sound on' : '🔇 Sound off'}
            </button>
          </div>

          <div className={`border py-10 text-center transition-colors duration-300 ${phaseAccent}`}>
            <p className="font-mono font-black tracking-tight text-gray-900 text-6xl md:text-7xl tabular-nums">
              {formatDuration(ticker.valueMs)}
            </p>
            <p className="mt-3 text-xs uppercase tracking-widest text-gray-500">
              {state.completedWork} work {state.completedWork === 1 ? 'block' : 'blocks'} done
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ticker.running ? (
              <button className={btnPrimary} onClick={ticker.pause}>
                Pause
              </button>
            ) : (
              <button className={btnPrimary} onClick={ticker.start}>
                Start
              </button>
            )}
            <button className={btnSecondary} onClick={() => advance(false)}>
              Skip
            </button>
            <button className={btnSecondary} onClick={resetCycle}>
              Reset
            </button>
            <button className={btnSecondary} onClick={() => setShowSettings(v => !v)}>
              {showSettings ? 'Hide settings' : 'Settings'}
            </button>
          </div>

          {showSettings && (
            <div className="flex flex-wrap items-end gap-3 border-t border-gray-200 pt-5">
              {SETTING_FIELDS.map(field => (
                <div key={field.key} className="flex flex-col gap-1">
                  <label className="text-gray-500 text-xs uppercase tracking-wider" htmlFor={`pomodoro-${field.key}`}>
                    {field.label}
                  </label>
                  <input
                    id={`pomodoro-${field.key}`}
                    className={numberInput}
                    type="number"
                    min={1}
                    max={field.max}
                    value={settings[field.key]}
                    onChange={e => updateSetting(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
};
