'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { convertTimezone, getExampleInput, TimezoneResult } from './logic';

export const TimezoneConverter = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<TimezoneResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') || '';
    setInput(from || getExampleInput());
  }, []);

  useEffect(() => {
    if (!input.trim()) { setResults([]); setError(''); return; }
    try {
      const res = convertTimezone(input);
      if (res.length === 0) {
        setError('Could not parse date. Try: 2024-01-15 14:30 UTC');
        setResults([]);
      } else {
        setResults(res);
        setError('');
      }
    } catch {
      setError('Invalid input');
      setResults([]);
    }
  }, [input]);

  const inputClass =
    'w-full bg-white text-gray-900 border border-gray-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-white/30';

  const content = (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider">
          Date &amp; Time
        </label>
        <input
          type="text"
          className={inputClass}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="2024-01-15 14:30 UTC"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-gray-600 mt-1">
          Format: YYYY-MM-DD HH:MM &lt;timezone&gt; — e.g. 2024-01-15 14:30 UTC or 2024-01-15 14:30 America/New_York
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {results.length > 0 && (
        <div className="overflow-hidden border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-white/5">
                <th className="text-left text-xs text-gray-400 px-4 py-2 font-medium">Location</th>
                <th className="text-left text-xs text-gray-400 px-4 py-2 font-medium">Date</th>
                <th className="text-left text-xs text-gray-400 px-4 py-2 font-medium">Time</th>
                <th className="text-left text-xs text-gray-400 px-4 py-2 font-medium hidden sm:table-cell">Offset</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={r.timezone} className={`border-b border-gray-200 ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}>
                  <td className="px-4 py-2 text-gray-300">{r.label}</td>
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{r.date}</td>
                  <td className="px-4 py-2 text-gray-200 font-mono">{r.time}</td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-xs hidden sm:table-cell">{r.offset}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="Time Zone Converter"
      description="Convert a date and time to [1 multiple time zones 2]. Input format: [1 2024-01-15 14:30 UTC 2] or [1 2024-01-15 14:30 America/New_York 2]. Shows 12 major world time zones."
      extraElements={content}
      backColor="lime"
    />
  );
};
