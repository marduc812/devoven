'use client';

import { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { BLAKE2B_SIZES, BlakeOutput, blake2bHash } from './logic';
import { INPUT_CLASS, LABEL_CLASS, SELECT_CLASS } from './controls';

export const Blake2b = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [bits, setBits] = useState(512);
  const [key, setKey] = useState('');
  const [output, setOutput] = useState<BlakeOutput>('hex');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);

    const size = Number(params.get('bits'));
    if (BLAKE2B_SIZES.includes(size as (typeof BLAKE2B_SIZES)[number])) setBits(size);

    const paramKey = params.get('key');
    if (paramKey) setKey(paramKey);

    const format = params.get('output');
    if (format === 'hex' || format === 'base64') setOutput(format);
  }, []);

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    try {
      setToValue(blake2bHash(fromValue, { bits, key, output }));
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not hash this input');
    }
  }, [fromValue, bits, key, output]);

  const extraElements = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASS}>Digest size</label>
        <select className={SELECT_CLASS} value={bits} onChange={(e) => setBits(Number(e.target.value))}>
          {BLAKE2B_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} bits
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASS}>Key (optional, max 64 bytes)</label>
        <input
          type="text"
          className={INPUT_CLASS}
          placeholder="leave empty for a plain hash"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASS}>Output</label>
        <select
          className={SELECT_CLASS}
          value={output}
          onChange={(e) => setOutput(e.target.value as BlakeOutput)}
        >
          <option value="hex">Hex</option>
          <option value="base64">Base64</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="BLAKE2b Hash Generator"
      description="BLAKE2b is a fast cryptographic hash optimised for 64-bit platforms, and is faster than MD5 while being as secure as SHA-3. Give it a key and it becomes a MAC — no HMAC construction needed. For example, [1 abc 2] at 512 bits becomes [1 ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Text Input"
      toTitle={`BLAKE2b-${bits} ${output === 'hex' ? 'Hash' : 'Hash (Base64)'}`}
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
