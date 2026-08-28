'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processMdTable, MdTableDirection, MdTableAlignment } from './logic';

const EXAMPLE_CSV = `Name,Language,Year
TypeScript,Compiled,2012
Rust,Systems,2010
Go,Compiled,2009`;

export function MdTableGenerator() {
  const [input, setInput] = useState(EXAMPLE_CSV);
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState<MdTableDirection>('auto');
  const [alignment, setAlignment] = useState<MdTableAlignment>('left');

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
      setOutput(processMdTable(input, direction, alignment));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, direction, alignment]);

  const extraElements = (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Direction:</span>
        <select
          className="bg-white text-gray-200 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
          value={direction}
          onChange={e => setDirection(e.target.value as MdTableDirection)}
        >
          <option value="auto">Auto-detect</option>
          <option value="csv-to-md">CSV → Markdown</option>
          <option value="md-to-csv">Markdown → CSV</option>
        </select>
      </div>
      {direction !== 'md-to-csv' && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Alignment:</span>
          <select
            className="bg-white text-gray-200 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30"
            value={alignment}
            onChange={e => setAlignment(e.target.value as MdTableAlignment)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="none">None</option>
          </select>
        </div>
      )}
    </div>
  );

  return (
    <AdvancedConverter
      title="Markdown Table Generator"
      description="Convert [1 CSV or tab-separated data 2] to a Markdown table, or parse a Markdown table back to CSV. First row is treated as headers. Supports [1 alignment options 2] (left, center, right). Auto-detects direction."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (CSV, TSV, or Markdown Table)"
      toTitle="Output"
      backColor="rose"
      extraElements={extraElements}
    />
  );
}
