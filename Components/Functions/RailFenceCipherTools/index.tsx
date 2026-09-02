'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processRailFence } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-20';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function RailFenceCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [rails, setRails] = useState(3);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const r = params.get('rails');
    if (r) setRails(parseInt(r) || 3);
    const m = params.get('mode');
    if (m === 'decode') setMode('decode');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ rails, mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processRailFence(input, rails, mode));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, rails, mode]);

  return (
    <AdvancedConverter
      title="Rail Fence Cipher"
      description="Classic transposition cipher that writes text in a [1 zigzag pattern 2] across a number of rails, then reads off each rail in order. The ASCII art below shows the pattern."
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
            onChange={(e) => setMode(e.target.value as 'encode' | 'decode')}
            className={selectClass}
          >
            <option value="encode">Encode</option>
            <option value="decode">Decode</option>
          </select>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Rails</label>
            <input
              type="number"
              min={2}
              max={20}
              value={rails}
              onChange={(e) => setRails(parseInt(e.target.value) || 2)}
              className={inputClass}
            />
          </div>
        </div>
      }
    />
  );
}
