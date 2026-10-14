'use client';

import { useEffect, useMemo, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { encodeA1Z26, decodeA1Z26 } from './logic';

export function A1Z26Converter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInput(params.get('from') ?? '');
    if (params.get('mode') === 'decode') setMode('decode');
  }, []);
  useShareLink({ mode });
  const output = useMemo(() => {
    try { return mode === 'encode' ? encodeA1Z26(input) : decodeA1Z26(input); }
    catch (error) { return 'Error: ' + (error instanceof Error ? error.message : String(error)); }
  }, [input, mode]);

  return <AdvancedConverter
    title="A1Z26 cipher"
    description="Convert A-Z letters to numbers, with A = 1 and Z = 26. Encoding ignores punctuation and digits. Hyphens separate letters, / separates words, and line breaks stay in place. Decoding also accepts spaces or commas between numbers and returns uppercase letters."
    fromValue={input} toValue={output} setFromValue={setInput}
    fromTitle={mode === 'encode' ? 'Text' : 'Numbers'} toTitle={mode === 'encode' ? 'Numbers' : 'Text'}
    backColor="yellow"
    extraElements={<label className="flex items-center gap-2 text-sm text-gray-700">
      Mode
      <select value={mode} onChange={(event) => setMode(event.target.value as 'encode' | 'decode')}
        className="border border-gray-300 bg-white px-3 py-1.5 text-gray-900">
        <option value="encode">Encode</option><option value="decode">Decode</option>
      </select>
    </label>}
  />;
}
