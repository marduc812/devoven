'use client';

import { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { BLAKE3_SIZES, BlakeOutput, blake3Hash } from './logic';
import { INPUT_CLASS, LABEL_CLASS, SELECT_CLASS } from './controls';

type Mode = 'hash' | 'keyed' | 'derive';

export const Blake3 = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [bits, setBits] = useState(256);
  const [mode, setMode] = useState<Mode>('hash');
  const [secret, setSecret] = useState('');
  const [output, setOutput] = useState<BlakeOutput>('hex');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);

    const size = Number(params.get('bits'));
    if (BLAKE3_SIZES.includes(size as (typeof BLAKE3_SIZES)[number])) setBits(size);

    const paramMode = params.get('mode');
    if (paramMode === 'hash' || paramMode === 'keyed' || paramMode === 'derive') setMode(paramMode);

    const format = params.get('output');
    if (format === 'hex' || format === 'base64') setOutput(format);
  }, []);

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    try {
      setToValue(
        blake3Hash(fromValue, {
          bits,
          output,
          key: mode === 'keyed' ? secret : undefined,
          context: mode === 'derive' ? secret : undefined,
        }),
      );
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not hash this input');
    }
  }, [fromValue, bits, mode, secret, output]);

  const extraElements = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASS}>Output size</label>
        <select className={SELECT_CLASS} value={bits} onChange={(e) => setBits(Number(e.target.value))}>
          {BLAKE3_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} bits
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={LABEL_CLASS}>Mode</label>
        <select className={SELECT_CLASS} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="hash">Plain hash</option>
          <option value="keyed">Keyed (MAC)</option>
          <option value="derive">Key derivation</option>
        </select>
      </div>

      {mode !== 'hash' && (
        <div className="flex flex-col gap-1">
          <label className={LABEL_CLASS}>
            {mode === 'keyed' ? 'Key (exactly 32 bytes)' : 'Context string'}
          </label>
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder={mode === 'keyed' ? '32-byte key' : 'example.com 2024-01-01 app key'}
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </div>
      )}

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
      title="BLAKE3 Hash Generator"
      description="BLAKE3 is a parallel, tree-based hash that is several times faster than SHA-256 and BLAKE2. It is an extendable-output function, so you can ask for any digest length, and it has built-in keyed and key-derivation modes instead of bolting on HMAC. For example, [1 abc 2] at 256 bits becomes [1 6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Text Input"
      toTitle={`BLAKE3 (${bits} bits)`}
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
