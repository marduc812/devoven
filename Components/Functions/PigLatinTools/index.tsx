'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { toPigLatin, fromPigLatin } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

export function PigLatinConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'to' | 'from'>('to');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'from') setMode('from');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(mode === 'to' ? toPigLatin(input) : fromPigLatin(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="Pig Latin Converter"
      description="Convert text [1 to or from Pig Latin 2]. Words starting with vowels get 'yay' appended; consonant clusters move to the end with 'ay'."
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
            onChange={(e) => setMode(e.target.value as 'to' | 'from')}
            className={selectClass}
          >
            <option value="to">To Pig Latin</option>
            <option value="from">From Pig Latin</option>
          </select>
        </div>
      }
    />
  );
}
