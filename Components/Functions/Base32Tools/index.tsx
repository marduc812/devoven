'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { base32Encode, base32Decode, isBase32 } from './logic';

export const Base32Converter = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') || '';
    if (from) {
      setFromValue(from);
      setDirection(isBase32(from) ? 'decode' : 'encode');
    }
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    // Auto-detect direction when user types
    const autoDir = isBase32(fromValue.trim()) ? 'decode' : 'encode';
    setDirection(autoDir);
    try {
      if (autoDir === 'encode') {
        setToValue(base32Encode(fromValue));
      } else {
        setToValue(base32Decode(fromValue));
      }
    } catch (e: unknown) {
      setToValue(e instanceof Error ? 'Error: ' + e.message : 'Conversion error');
    }
  }, [fromValue]);

  const selectClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <div className="flex items-center gap-2">
      <label className="text-gray-400 text-xs whitespace-nowrap">Mode (auto-detected)</label>
      <select
        className={selectClass}
        value={direction}
        onChange={(e) => setDirection(e.target.value as 'encode' | 'decode')}
        disabled
      >
        <option value="encode">Encode (text to Base32)</option>
        <option value="decode">Decode (Base32 to text)</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="Base32 Encoder / Decoder"
      description="Encode text to [1 Base32 2] (RFC 4648) or decode Base32 back to text. The direction is auto-detected: input matching [1 A-Z 2-7 = 2] is decoded automatically."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={direction === 'encode' ? 'Plain Text' : 'Base32'}
      toTitle={direction === 'encode' ? 'Base32' : 'Plain Text'}
      extraElements={extraElements}
      backColor="yellow"
    />
  );
};
