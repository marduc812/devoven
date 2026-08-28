'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateMockData, MockOutputFormat } from './logic';

const EXAMPLE_SCHEMA = JSON.stringify({
  type: 'object',
  title: 'User',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer' },
    active: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    role: { type: 'string', enum: ['admin', 'user', 'moderator'] },
  },
}, null, 2);

export function ApiMockGenerator() {
  const [input, setInput] = useState(EXAMPLE_SCHEMA);
  const [output, setOutput] = useState('');
  const [format, setFormat] = useState<MockOutputFormat>('mock-data');
  const [count, setCount] = useState(3);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(generateMockData(input, count, format));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, format, count]);

  const extraElements = (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Output:</span>
        <select
          className="bg-white text-gray-200 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
          value={format}
          onChange={e => setFormat(e.target.value as MockOutputFormat)}
        >
          <option value="mock-data">Mock Data (JSON Array)</option>
          <option value="json-server">json-server db.json</option>
          <option value="msw">MSW Handler</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Count:</span>
        <input
          type="number"
          min={1}
          max={100}
          value={count}
          onChange={e => setCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
          className="bg-white text-gray-200 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30 w-20"
        />
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="API Response Mock Generator"
      description="Paste a [1 JSON Schema 2] or [1 example JSON object 2] to generate realistic mock data. Choose output as a plain JSON array, a [1 json-server db.json 2] config, or a [1 Mock Service Worker (MSW) handler 2] code snippet."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="JSON Schema or Example JSON"
      toTitle="Generated Output"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
