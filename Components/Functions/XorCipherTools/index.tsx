'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processXor, XorKeyFormat } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function XorCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [keyFormat, setKeyFormat] = useState<XorKeyFormat>('text');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const fmt = params.get('keyFormat');
    if (fmt === 'hex' || fmt === 'text') setKeyFormat(fmt);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processXor(input, keyFormat));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, keyFormat]);

  return (
    <AdvancedConverter
      title="XOR Cipher"
      description="Encrypt or decrypt text using repeating-key XOR. First line: [1 key: yourkey 2]. For text keys use text mode; for hex keys use hex mode. Encryption outputs hex bytes; hex input is auto-detected and decrypted."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (key: line + text or hex)"
      toTitle="Output"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <label className={labelClass}>Key Format</label>
          <select
            value={keyFormat}
            onChange={(e) => setKeyFormat(e.target.value as XorKeyFormat)}
            className={selectClass}
          >
            <option value="text">Text</option>
            <option value="hex">Hex</option>
          </select>
        </div>
      }
    />
  );
}
