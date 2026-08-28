'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processColumnar } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-36';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function ColumnarTransposition() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('ZEBRA');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const k = params.get('key');
    if (k) setKey(k);
    const m = params.get('mode');
    if (m === 'decrypt') setMode('decrypt');
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processColumnar(input, key, mode));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, key, mode]);

  return (
    <AdvancedConverter
      title="Columnar Transposition Cipher"
      description="Classical transposition cipher. Text is written in rows under a [1 keyword 2], then columns are read off in alphabetical order of the keyword letters. A grid visualization is shown below the result."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Output"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'encrypt' | 'decrypt')}
            className={selectClass}
          >
            <option value="encrypt">Encrypt</option>
            <option value="decrypt">Decrypt</option>
          </select>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={inputClass}
              placeholder="e.g. ZEBRA"
            />
          </div>
        </div>
      }
    />
  );
}
