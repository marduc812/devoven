'use client';
import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { textToHtmlTable, Delimiter } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

export function TextToHtmlTable() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [delimiter, setDelimiter] = useState<Delimiter>('auto');
  const [hasHeader, setHasHeader] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
    const d = p.get('delimiter');
    if (d) setDelimiter(d as Delimiter);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(textToHtmlTable(input, delimiter, hasHeader));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, delimiter, hasHeader]);

  return (
    <AdvancedConverter
      title="Text to HTML Table"
      description="Convert delimited text (CSV, TSV, pipe-separated) to an [1 HTML table 2]. Supports auto-detection of delimiter. Escapes HTML special characters automatically."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Delimited Text"
      toTitle="HTML Table"
      backColor="cyan"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value as Delimiter)}
            className={selectClass}
          >
            <option value="auto">Auto Detect</option>
            <option value="comma">Comma (CSV)</option>
            <option value="tab">Tab (TSV)</option>
            <option value="pipe">Pipe (|)</option>
            <option value="semicolon">Semicolon (;)</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="rounded"
            />
            First row is header
          </label>
        </div>
      }
    />
  );
}
