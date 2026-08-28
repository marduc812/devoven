'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { minifyJson, beautifyJson, getJsonStats } from './logic';

type Mode = 'minify' | 'beautify2' | 'beautify4' | 'beautifytab';

export const JsonMinify = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<Mode>('minify');
  const [stats, setStats] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      setStats('');
      return;
    }
    try {
      let result: string;
      if (mode === 'minify') {
        result = minifyJson(fromValue);
      } else if (mode === 'beautify2') {
        result = beautifyJson(fromValue, 2);
      } else if (mode === 'beautify4') {
        result = beautifyJson(fromValue, 4);
      } else {
        result = beautifyJson(fromValue, '\t');
      }
      setToValue(result);
      const minified = minifyJson(fromValue);
      const beautified = beautifyJson(fromValue, 2);
      setStats(getJsonStats(minified, beautified));
    } catch (e: unknown) {
      setToValue(e instanceof Error ? `Error: ${e.message}` : 'Invalid JSON');
      setStats('');
    }
  }, [fromValue, mode]);

  const modeSelector = (
    <div className="flex flex-wrap gap-2">
      {([
        { value: 'minify', label: 'Minify' },
        { value: 'beautify2', label: 'Beautify (2 spaces)' },
        { value: 'beautify4', label: 'Beautify (4 spaces)' },
        { value: 'beautifytab', label: 'Beautify (tab)' },
      ] as { value: Mode; label: string }[]).map(opt => (
        <button
          key={opt.value}
          onClick={() => setMode(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
            mode === opt.value
              ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
              : 'bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <AdvancedConverter
      title="JSON Minifier / Beautifier"
      description="Minify [1 JSON 2] to remove all whitespace, or beautify it with configurable indentation."
      fromValue={fromValue}
      toValue={stats ? `${toValue}\n\n— ${stats}` : toValue}
      setFromValue={setFromValue}
      fromTitle="Input JSON"
      toTitle="Output"
      backColor="cyan"
      extraElements={modeSelector}
    />
  );
};
