'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { extractCssVariables, formatCssVariables, cssVariablesToJson } from './logic';

export const CssVariableExtractor = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'css' | 'json'>('css');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'json') setMode('json');
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const vars = extractCssVariables(input);
    setOutput(mode === 'json' ? cssVariablesToJson(vars) : formatCssVariables(vars));
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="CSS Variable Extractor"
      description="Extract all CSS [1 custom properties 2] (--var: value) from CSS text. View as grouped CSS or JSON."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="CSS Input"
      toTitle="Extracted Variables"
      backColor="cyan"
      extraElements={
        <select
          value={mode}
          onChange={e => setMode(e.target.value as 'css' | 'json')}
          className="border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900"
        >
          <option value="css">CSS output</option>
          <option value="json">JSON output</option>
        </select>
      }
    />
  );
};
