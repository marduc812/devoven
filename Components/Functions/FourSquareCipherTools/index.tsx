'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processFourSquare } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-36';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function FourSquareCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key1, setKey1] = useState('EXAMPLE');
  const [key2, setKey2] = useState('KEYWORD');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const k1 = params.get('key1');
    if (k1) setKey1(k1);
    const k2 = params.get('key2');
    if (k2) setKey2(k2);
    const m = params.get('mode');
    if (m === 'decrypt') setMode('decrypt');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ key1, key2, mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processFourSquare(input, key1, key2, mode));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, key1, key2, mode]);

  return (
    <AdvancedConverter
      title="Four-Square Cipher"
      description="Digraphic substitution using [1 four 5×5 Polybius squares 2]. Two key squares (top-right, bottom-left) and two standard alphabet squares. Encrypt digraphs by crossing rows and columns across the key squares."
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
            <label className={labelClass}>Key 1</label>
            <input
              type="text"
              value={key1}
              onChange={(e) => setKey1(e.target.value)}
              className={inputClass}
              placeholder="e.g. EXAMPLE"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Key 2</label>
            <input
              type="text"
              value={key2}
              onChange={(e) => setKey2(e.target.value)}
              className={inputClass}
              placeholder="e.g. KEYWORD"
            />
          </div>
        </div>
      }
    />
  );
}
