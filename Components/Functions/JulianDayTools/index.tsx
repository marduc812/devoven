'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parseGregorianToJDN, parseJDNToGregorian } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

type Mode = 'toJDN' | 'fromJDN';

export const JulianDayCalculator = () => {
  const [mode, setMode] = useState<Mode>('toJDN');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      if (mode === 'toJDN') {
        const r = parseGregorianToJDN(input);
        const lines = [
          `Date:              ${r.dateFormatted}`,
          `Day of week:       ${r.dayOfWeek}`,
          `Julian Day Number: ${r.jdn}`,
          `Modified JD (MJD): ${r.mjd.toFixed(1)}`,
          `Easter ${input.slice(0, 4)}:       ${r.easter.formatted}`,
        ];
        setOutput(lines.join('\n'));
      } else {
        const r = parseJDNToGregorian(input);
        const lines = [
          `Julian Day Number: ${r.jdn}`,
          `Gregorian Date:    ${r.dateFormatted}`,
          `Day of week:       ${r.dayOfWeek}`,
          `Modified JD (MJD): ${r.mjd.toFixed(1)}`,
        ];
        setOutput(lines.join('\n'));
      }
      setError('');
    } catch (e) {
      setOutput('');
      setError(e instanceof Error ? e.message : 'Invalid input');
    }
  }, [input, mode]);

  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';
  const btnBase = 'px-4 py-2 text-sm font-semibold transition-colors duration-150';
  const btnActive = 'bg-indigo-600 text-white';
  const btnInactive = 'bg-white text-gray-400 hover:text-gray-900 border border-gray-200';

  return (
    <Panel
      title="Julian Day Number Calculator"
      description="Convert between [1 Gregorian calendar dates 2] and [1 Julian Day Numbers 2] (JDN) used in astronomy. Also computes Modified Julian Date (MJD) and Easter Sunday."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button className={`${btnBase} ${mode === 'toJDN' ? btnActive : btnInactive}`} onClick={() => { setMode('toJDN'); setInput(''); setOutput(''); }}>
              Date → JDN
            </button>
            <button className={`${btnBase} ${mode === 'fromJDN' ? btnActive : btnInactive}`} onClick={() => { setMode('fromJDN'); setInput(''); setOutput(''); }}>
              JDN → Date
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              {mode === 'toJDN' ? 'Gregorian Date (YYYY-MM-DD)' : 'Julian Day Number (integer)'}
            </label>
            <input
              type="text"
              className={textareaClass}
              placeholder={mode === 'toJDN' ? '2000-01-01' : '2451545'}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

          {output && (
            <div className="flex flex-col gap-2">
              <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">Result</label>
              <pre className="bg-gray-50 p-3 border border-gray-200 font-mono text-sm text-gray-900 whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}

          <div className="w-full h-px bg-gray-200" />
          <div className="text-gray-500 text-xs font-mono space-y-1">
            <p>JDN 0 = 1 January 4713 BC (Julian calendar) = 24 November 4714 BC (Gregorian)</p>
            <p>JDN 2451545 = 1 January 2000 (J2000.0 epoch)</p>
            <p>MJD = JDN − 2400000.5 (starts at midnight, not noon)</p>
          </div>
        </div>
      }
    />
  );
};
