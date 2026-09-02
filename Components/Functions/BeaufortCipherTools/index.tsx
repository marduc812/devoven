'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processBeaufort } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-36';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function BeaufortCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('KEY');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const k = params.get('key');
    if (k) setKey(k);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ key })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processBeaufort(input, key));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, key]);

  return (
    <AdvancedConverter
      title="Beaufort Cipher"
      description="Variant of the Vigenère cipher. Each letter is encrypted as [1 (key − plain + 26) mod 26 2]. The Beaufort cipher is symmetric — encrypting twice returns the original text."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Output (Encrypt / Decrypt)"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className={labelClass}>Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={inputClass}
              placeholder="e.g. KEY"
            />
          </div>
        </div>
      }
    />
  );
}
