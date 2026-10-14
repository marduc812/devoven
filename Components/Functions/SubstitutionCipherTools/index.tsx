'use client';

import { useEffect, useMemo, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { substitute, PLAIN_ALPHABET, DEFAULT_CIPHER_ALPHABET } from './logic';

export function SubstitutionCipher() {
  const [input, setInput] = useState('');
  const [alphabet, setAlphabet] = useState(DEFAULT_CIPHER_ALPHABET);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInput(params.get('from') ?? '');
    setAlphabet(params.get('alphabet') ?? DEFAULT_CIPHER_ALPHABET);
    if (params.get('mode') === 'decrypt') setMode('decrypt');
  }, []);
  useShareLink({ alphabet, mode });
  const output = useMemo(() => {
    try { return substitute(input, alphabet, mode); }
    catch (error) { return 'Error: ' + (error instanceof Error ? error.message : String(error)); }
  }, [input, alphabet, mode]);

  return <AdvancedConverter
    title="Substitution cipher"
    description="Replace each A-Z letter with the letter at the same position in your cipher alphabet. Use each letter exactly once. Decryption reverses the mapping. Letter case, punctuation and other characters stay in place."
    fromValue={input} toValue={output} setFromValue={setInput}
    fromTitle="Input text" toTitle="Output text" backColor="yellow"
    extraElements={<div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm text-gray-700">Mode
        <select value={mode} onChange={(event) => setMode(event.target.value as 'encrypt' | 'decrypt')}
          className="border border-gray-300 bg-white px-3 py-1.5 text-gray-900">
          <option value="encrypt">Encrypt</option><option value="decrypt">Decrypt</option>
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-700">Cipher alphabet
        <span className="font-mono text-xs text-gray-500">{PLAIN_ALPHABET}</span>
        <input value={alphabet} onChange={(event) => setAlphabet(event.target.value)} spellCheck={false}
          className="w-full max-w-full border border-gray-300 bg-white px-3 py-1.5 font-mono text-sm text-gray-900" />
      </label>
    </div>}
  />;
}
