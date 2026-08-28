'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { jsonlToJson, jsonToJsonl } from './logic';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

type Mode = 'jsonl-to-json' | 'json-to-jsonl';

export function JsonlParser() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('jsonl-to-json');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode') as Mode;
    if (m) setMode(m);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      if (mode === 'jsonl-to-json') {
        setOutput(jsonlToJson(input));
      } else {
        setOutput(jsonToJsonl(input));
      }
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="JSONL Parser"
      description="Parse JSONL (JSON Lines) format — one JSON object per line — to a JSON array and back. JSONL has one JSON value per line, making it easy to stream and process large datasets."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="cyan"
      extraElements={
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className={selectClass}
        >
          <option value="jsonl-to-json">JSONL → JSON</option>
          <option value="json-to-jsonl">JSON → JSONL</option>
        </select>
      }
    />
  );
}
