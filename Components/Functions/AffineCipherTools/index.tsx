'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processAffine, gcd } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-20';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function AffineCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [a, setA] = useState(5);
  const [b, setB] = useState(8);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const pa = params.get('a');
    if (pa) setA(parseInt(pa) || 5);
    const pb = params.get('b');
    if (pb) setB(parseInt(pb) || 8);
    const m = params.get('mode');
    if (m === 'decrypt') setMode('decrypt');
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processAffine(input, a, b, mode));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, a, b, mode]);

  const aValid = gcd(a, 26) === 1;

  return (
    <AdvancedConverter
      title="Affine Cipher"
      description="Encrypt or decrypt using the Affine cipher. Formula: [1 E(x) = (ax + b) mod 26 2]. Parameter [1 a 2] must be coprime with 26. Step-by-step shown for the first 5 characters."
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
            <label className={labelClass}>a</label>
            <input
              type="number"
              min={1}
              max={25}
              value={a}
              onChange={(e) => setA(parseInt(e.target.value) || 1)}
              className={inputClass + (!aValid ? ' border-red-500' : '')}
            />
            {!aValid && <span className="text-xs text-red-400">not coprime with 26</span>}
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>b</label>
            <input
              type="number"
              min={0}
              max={25}
              value={b}
              onChange={(e) => setB(parseInt(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        </div>
      }
    />
  );
}
