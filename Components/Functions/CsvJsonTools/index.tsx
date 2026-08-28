'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { csvToJson, jsonToCsv, detectInputType } from './logic';

export function CsvJsonConverter() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<'csv-to-json' | 'json-to-csv' | 'auto'>('auto');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const effectiveDirection =
      direction === 'auto' ? (detectInputType(input) === 'json' ? 'json-to-csv' : 'csv-to-json') : direction;
    if (effectiveDirection === 'csv-to-json') {
      setOutput(csvToJson(input));
    } else {
      setOutput(jsonToCsv(input));
    }
  }, [input, direction]);

  const extraElements = (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-sm">Direction:</span>
      <select
        className="bg-white text-gray-200 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
        value={direction}
        onChange={e => setDirection(e.target.value as 'csv-to-json' | 'json-to-csv' | 'auto')}
      >
        <option value="auto">Auto-detect</option>
        <option value="csv-to-json">CSV → JSON</option>
        <option value="json-to-csv">JSON → CSV</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="CSV / JSON Converter"
      description="Convert between CSV and JSON formats. Auto-detects direction, or choose manually. Handles [1 quoted fields 2], [1 commas in quotes 2], and [1 escaped quotes 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (CSV or JSON)"
      toTitle="Output"
      backColor="cyan"
      extraElements={extraElements}
    />
  );
}
