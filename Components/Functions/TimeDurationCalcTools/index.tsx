'use client';

import React, { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { parseDuration, breakdown, combineDurations, formatBreakdown, Operation } from './logic';

export function TimeDurationCalculator() {
  const [fromValue, setFromValue] = useState('');
  const [secondDuration, setSecondDuration] = useState('');
  const [operation, setOperation] = useState<Operation>('add');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      let totalSeconds: number;
      if (secondDuration.trim()) {
        totalSeconds = combineDurations(fromValue, secondDuration, operation);
      } else {
        totalSeconds = parseDuration(fromValue);
      }
      const b = breakdown(totalSeconds);
      setToValue(formatBreakdown(b));
    } catch (e: unknown) {
      setToValue(e instanceof Error ? e.message : 'Invalid input');
    }
  }, [fromValue, secondDuration, operation]);

  const extraEl = (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-400">Second Duration (optional — for add/subtract)</label>
        <input
          type="text"
          value={secondDuration}
          onChange={e => setSecondDuration(e.target.value)}
          placeholder="e.g. 45m or 1h 30m"
          className="w-full bg-white border border-gray-300 text-gray-900 text-sm px-3 py-2 focus:outline-none focus:border-gray-900"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setOperation('add')}
          className={`px-4 py-2 text-sm font-medium border transition-colors duration-200 cursor-pointer ${
            operation === 'add'
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-700/40'
          }`}
        >
          Add (+)
        </button>
        <button
          onClick={() => setOperation('subtract')}
          className={`px-4 py-2 text-sm font-medium border transition-colors duration-200 cursor-pointer ${
            operation === 'subtract'
              ? 'bg-gray-900 border-gray-900 text-white'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-700/40'
          }`}
        >
          Subtract (-)
        </button>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="Time Duration Calculator"
      description="Parse and convert time durations. Supports [1 2h 30m 2], [1 1:30:00 2], [1 90 minutes 2], [1 1d 4h 30m 15s 2]. Optionally add or subtract a second duration."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Duration"
      toTitle="Breakdown"
      extraElements={extraEl}
      backColor="lime"
    />
  );
}
