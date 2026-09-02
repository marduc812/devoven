'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processPolybius } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-40';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function PolybiusCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const kw = params.get('keyword');
    if (kw) setKeyword(kw);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ keyword })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processPolybius(input, keyword));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, keyword]);

  return (
    <AdvancedConverter
      title="Polybius Square Cipher"
      description="Encodes letters as [1 row/column 2] pairs in a 5×5 grid (I and J share position). For example A=11, B=12. An optional keyword rearranges the alphabet. Auto-detects encode/decode."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (text or number pairs)"
      toTitle="Output"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <label className={labelClass}>Keyword (optional)</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className={inputClass}
          />
        </div>
      }
    />
  );
}
