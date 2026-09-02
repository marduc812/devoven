'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processTapCode } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

export function TapCode() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'decode') setMode('decode');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processTapCode(input, mode));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="Tap Code"
      description="Encode or decode text using the [1 5×5 Polybius square tap code 2] used by POWs. Each letter is row.col expressed as dot groups (e.g. A = . . / B = . ..). K is mapped to C. The grid is shown below."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'encode' | 'decode')}
            className={selectClass}
          >
            <option value="encode">Encode</option>
            <option value="decode">Decode</option>
          </select>
        </div>
      }
    />
  );
}
