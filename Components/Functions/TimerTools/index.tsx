'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { formatDuration, parseDurationParam, splitMs, toMs } from '../TimerShared/duration';
import { useTicker } from '../TimerShared/useTicker';
import { loadSoundPreference, playBeep, saveSoundPreference } from '../TimerShared/beep';
import { buildLap, formatLap, type Lap } from './logic';

type Mode = 'countdown' | 'stopwatch';

const PRESETS = [
  { label: '1 min', ms: 60000 },
  { label: '5 min', ms: 300000 },
  { label: '10 min', ms: 600000 },
  { label: '25 min', ms: 1500000 },
];

const btnPrimary =
  'px-5 py-2 border border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const btnSecondary =
  'px-5 py-2 border border-gray-300 bg-white text-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const numberInput =
  'bg-white text-gray-900 p-2 w-20 border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm text-center';

export const Timer = () => {
  const [mode, setMode] = useState<Mode>('countdown');
  const [durationMs, setDurationMs] = useState(300000);
  const [finished, setFinished] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(loadSoundPreference());
  }, []);

  const handleComplete = useCallback(() => {
    setFinished(true);
    if (loadSoundPreference()) playBeep();
  }, []);

  const countdown = useTicker(300000, 'down', handleComplete);
  const stopwatch = useTicker(0, 'up');

  const { reset: resetCountdown } = countdown;

  // Changing the duration always rewinds the countdown. This is done
  // explicitly rather than in an effect so that pausing — which also clears
  // `running` — cannot discard the remaining time.
  const applyDuration = useCallback((ms: number) => {
    setDurationMs(ms);
    setFinished(false);
    resetCountdown(ms);
  }, [resetCountdown]);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from');
    if (!from) return;
    const parsed = parseDurationParam(from);
    if (parsed !== null) applyDuration(parsed);
  }, [applyDuration]);

  const parts = splitMs(durationMs);

  const setPart = (key: 'hours' | 'minutes' | 'seconds', raw: string) => {
    const value = Math.max(0, Math.min(key === 'hours' ? 99 : 59, parseInt(raw, 10) || 0));
    const next = { ...parts, [key]: value };
    applyDuration(toMs(next.hours, next.minutes, next.seconds));
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    saveSoundPreference(next);
  };

  const startCountdown = () => {
    if (finished) {
      setFinished(false);
      resetCountdown(durationMs);
    }
    countdown.start();
  };

  const active = mode === 'countdown' ? countdown : stopwatch;
  const displayValue = formatDuration(active.valueMs);
  const showFinished = mode === 'countdown' && finished;

  const tabClass = (tab: Mode) =>
    `px-4 py-2 text-sm font-medium border transition-colors duration-200 cursor-pointer ${
      mode === tab
        ? 'border-gray-900 bg-gray-900 text-white'
        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
    }`;

  return (
    <Panel
      title="Timer & Stopwatch"
      description="Count down from a set duration or count up with lap times. Pre-fill the countdown with [1 ?from=5m30s 2] or [1 ?from=300 2]. Runs entirely in your browser and stays accurate in background tabs."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-2">
              <button className={tabClass('countdown')} onClick={() => setMode('countdown')}>
                Countdown
              </button>
              <button className={tabClass('stopwatch')} onClick={() => setMode('stopwatch')}>
                Stopwatch
              </button>
            </div>
            <button
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
              onClick={toggleSound}
              aria-pressed={soundOn}
            >
              {soundOn ? '🔊 Sound on' : '🔇 Sound off'}
            </button>
          </div>

          <div
            className={`border py-10 text-center transition-colors duration-300 ${
              showFinished ? 'border-emerald-500 bg-emerald-50 timer-finished' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <p className="font-mono font-black tracking-tight text-gray-900 text-6xl md:text-7xl tabular-nums">
              {displayValue}
            </p>
            {showFinished && (
              <p className="mt-3 text-sm font-bold uppercase tracking-widest text-emerald-700">
                Time&apos;s up
              </p>
            )}
          </div>

          {mode === 'countdown' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    className={btnSecondary}
                    onClick={() => applyDuration(preset.ms)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-3">
                {(['hours', 'minutes', 'seconds'] as const).map(key => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs uppercase tracking-wider" htmlFor={`timer-${key}`}>
                      {key}
                    </label>
                    <input
                      id={`timer-${key}`}
                      className={numberInput}
                      type="number"
                      min={0}
                      max={key === 'hours' ? 99 : 59}
                      value={parts[key]}
                      disabled={countdown.running}
                      onChange={e => setPart(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {countdown.running ? (
                  <button className={btnPrimary} onClick={countdown.pause}>
                    Pause
                  </button>
                ) : (
                  <button className={btnPrimary} onClick={startCountdown} disabled={durationMs <= 0}>
                    Start
                  </button>
                )}
                <button
                  className={btnSecondary}
                  onClick={() => applyDuration(durationMs)}
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex gap-2">
                {stopwatch.running ? (
                  <button className={btnPrimary} onClick={stopwatch.pause}>
                    Pause
                  </button>
                ) : (
                  <button className={btnPrimary} onClick={stopwatch.start}>
                    Start
                  </button>
                )}
                <button
                  className={btnSecondary}
                  onClick={() => setLaps(current => [...current, buildLap(current, stopwatch.valueMs)])}
                  disabled={!stopwatch.running}
                >
                  Lap
                </button>
                <button
                  className={btnSecondary}
                  onClick={() => {
                    stopwatch.reset(0);
                    setLaps([]);
                  }}
                >
                  Reset
                </button>
              </div>

              {laps.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="flex text-gray-500 text-xs font-semibold uppercase tracking-wider pb-1 border-b border-gray-200">
                    <span className="w-20">Lap</span>
                    <span className="w-24">Split</span>
                    <span className="w-24">Total</span>
                  </div>
                  {[...laps].reverse().map(lap => {
                    const row = formatLap(lap);
                    return (
                      <div key={lap.index} className="flex text-sm py-1">
                        <span className="w-20 text-gray-500">{row.label}</span>
                        <span className="w-24 font-mono text-gray-900">{row.split}</span>
                        <span className="w-24 font-mono text-gray-500">{row.total}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
};
