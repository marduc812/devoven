'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processAtbash } from './logic';

const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function AtbashCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [includeHebrew, setIncludeHebrew] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const heb = params.get('hebrew');
    if (heb === 'true') setIncludeHebrew(true);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processAtbash(input, includeHebrew));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, includeHebrew]);

  return (
    <AdvancedConverter
      title="Atbash Cipher"
      description="Reverse alphabet substitution: [1 A↔Z, B↔Y, C↔X 2] and so on. Since Atbash is its own inverse, encoding and decoding are identical. Optionally apply Hebrew Atbash (aleph↔tav)."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Output"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHebrew}
              onChange={(e) => setIncludeHebrew(e.target.checked)}
              className="rounded"
            />
            <span className={labelClass}>Include Hebrew Atbash</span>
          </label>
        </div>
      }
    />
  );
}
