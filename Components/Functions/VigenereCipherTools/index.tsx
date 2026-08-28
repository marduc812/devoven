'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { vigenereEncrypt, vigenereDecrypt } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-36';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function VigenereEncodingConverter() {
  return <VigenereCipherConverterBase backColor="yellow" />;
}

function VigenereCipherConverterBase({ backColor }: { backColor: 'yellow' | 'rose' }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('KEY');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const k = params.get('key');
    if (k) setKey(k);
    const m = params.get('mode');
    if (m === 'decrypt') setMode('decrypt');
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      if (mode === 'decrypt') {
        setOutput(vigenereDecrypt(input, key));
      } else {
        setOutput(vigenereEncrypt(input, key));
      }
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input, key, mode]);

  return (
    <AdvancedConverter
      title="Vigenère Cipher"
      description="Encrypt or decrypt text using the Vigenère cipher. Enter a [1 keyword 2] as the key — only letters are used from it."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input"
      toTitle="Output"
      backColor={backColor}
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
            <label className={labelClass}>Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={inputClass}
              placeholder="e.g. LEMON"
            />
          </div>
        </div>
      }
    />
  );
}
