'use client';

import { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { BLAKE2S_SIZES, BlakeOutput, blake2sHash } from './logic';
import { INPUT_CLASS, LABEL_CLASS, SELECT_CLASS } from './controls';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const Blake2s = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [bits, setBits] = useState(256);
  const [key, setKey] = useState('');
  const [output, setOutput] = useState<BlakeOutput>('hex');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);

    const size = Number(params.get('bits'));
    if (BLAKE2S_SIZES.includes(size as (typeof BLAKE2S_SIZES)[number])) setBits(size);

    const paramKey = params.get('key');
    if (paramKey) setKey(paramKey);

    const format = params.get('output');
    if (format === 'hex' || format === 'base64') setOutput(format);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ bits, key, output })

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    try {
      setToValue(blake2sHash(fromValue, { bits, key, output }));
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not hash this input');
    }
  }, [fromValue, bits, key, output]);

  const extraElements = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASS}>Digest size</label>
        <select className={SELECT_CLASS} value={bits} onChange={(e) => setBits(Number(e.target.value))}>
          {BLAKE2S_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} bits
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASS}>Key (optional, max 32 bytes)</label>
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
      title="BLAKE2s Hash Generator"
      description="BLAKE2s is the 32-bit sibling of BLAKE2b, tuned for smaller architectures and embedded targets, with digests up to 256 bits. Like BLAKE2b it takes an optional key and becomes a MAC on its own. For example, [1 abc 2] at 256 bits becomes [1 508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Text Input"
      toTitle={`BLAKE2s-${bits} ${output === 'hex' ? 'Hash' : 'Hash (Base64)'}`}
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
