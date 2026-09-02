'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { caesarShift, bruteForceCaesar } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-20';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function CaesarCipherConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [shift, setShift] = useState(13);
  const [mode, setMode] = useState<'encode' | 'decode' | 'brute'>('encode');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const s = params.get('shift');
    if (s) setShift(parseInt(s) || 13);
    const m = params.get('mode');
    if (m === 'decode' || m === 'brute') setMode(m);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ shift, mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      if (mode === 'brute') {
        setOutput(bruteForceCaesar(input));
      } else if (mode === 'decode') {
        setOutput(caesarShift(input, -shift));
      } else {
        setOutput(caesarShift(input, shift));
      }
    } catch {
      setOutput('');
    }
  }, [input, shift, mode]);

  return (
    <AdvancedConverter
      title="Caesar Cipher"
      description="Encode or decode text using the Caesar cipher. Shift [1 13 2] is ROT13. Use Brute Force to try all 26 shifts."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="rose"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'encode' | 'decode' | 'brute')}
            className={selectClass}
          >
            <option value="encode">Encode</option>
            <option value="decode">Decode</option>
            <option value="brute">Brute Force</option>
          </select>
          {mode !== 'brute' && (
            <div className="flex items-center gap-2">
              <label className={labelClass}>Shift</label>
              <input
                type="number"
                min={0}
                max={25}
                value={shift}
                onChange={(e) => setShift(parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          )}
        </div>
      }
    />
  );
}
