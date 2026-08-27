'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { gitConfigToJson, jsonToGitConfig } from './logic';

type Mode = 'toJson' | 'toConfig';

export const GitConfigParser = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('toJson');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'toConfig') setMode('toConfig');
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      setError('');
      setOutput(mode === 'toJson' ? gitConfigToJson(input) : jsonToGitConfig(input));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Parse error');
      setOutput('');
    }
  }, [input, mode]);

  const fromTitle = mode === 'toJson' ? 'Git Config' : 'JSON';
  const toTitle = mode === 'toJson' ? 'JSON' : 'Git Config';

  return (
    <AdvancedConverter
      title="Git Config Parser"
      description="Parse [1 .gitconfig 2] files to JSON and convert JSON back to git config format."
      fromValue={input}
      toValue={error ? error : output}
      setFromValue={setInput}
      fromTitle={fromTitle}
      toTitle={toTitle}
      backColor="cyan"
      extraElements={
        <select
          value={mode}
          onChange={e => setMode(e.target.value as Mode)}
          className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="toJson">Git Config → JSON</option>
          <option value="toConfig">JSON → Git Config</option>
        </select>
      }
    />
  );
};
