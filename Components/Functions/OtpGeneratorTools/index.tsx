'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processOtpEncrypt, processOtpDecrypt } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-72';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function OtpGenerator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [hexKey, setHexKey] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'decrypt') setMode('decrypt');
    const k = params.get('key');
    if (k) setHexKey(k);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode, key: hexKey })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      if (mode === 'encrypt') {
        setOutput(processOtpEncrypt(input));
      } else {
        setOutput(processOtpDecrypt(input, hexKey));
      }
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, mode, hexKey]);

  return (
    <AdvancedConverter
      title="One-Time Pad Generator"
      description="Generate a [1 random one-time pad key 2] and XOR-encrypt your text. In decrypt mode, provide the cipher hex in the input and the key hex below. Note: Math.random() is NOT cryptographically secure."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={mode === 'encrypt' ? 'Plaintext' : 'Cipher (hex)'}
      toTitle="Result"
      backColor="yellow"
      extraElements={
        <div className="flex flex-col gap-3">
          <div className="flex flex-row flex-wrap gap-3 items-center">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'encrypt' | 'decrypt')}
              className={selectClass}
            >
              <option value="encrypt">Encrypt (generate key)</option>
              <option value="decrypt">Decrypt</option>
            </select>
          </div>
          {mode === 'decrypt' && (
            <div className="flex items-center gap-2">
              <label className={labelClass}>Key (hex)</label>
              <input
                type="text"
                value={hexKey}
                onChange={(e) => setHexKey(e.target.value)}
                className={inputClass}
                placeholder="Paste key hex here"
              />
            </div>
          )}
        </div>
      }
    />
  );
}
