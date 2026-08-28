'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { base85Encode, base85Decode, isLikelyBase85Encoded } from './logic';

export const Base85Converter = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<'adobe' | 'raw'>('adobe');
  const [direction, setDirection] = useState<'auto' | 'encode' | 'decode'>('auto');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      let result = '';
      if (direction === 'auto') {
        if (isLikelyBase85Encoded(fromValue)) {
          result = base85Decode(fromValue);
        } else {
          result = base85Encode(fromValue, mode === 'adobe');
        }
      } else if (direction === 'encode') {
        result = base85Encode(fromValue, mode === 'adobe');
      } else {
        result = base85Decode(fromValue);
      }
      setToValue(result);
    } catch {
      setToValue('Invalid Base85 input');
    }
  }, [fromValue, mode, direction]);

  const selectClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">Direction</label>
        <select
          className={selectClass}
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'auto' | 'encode' | 'decode')}
        >
          <option value="auto">Auto-detect</option>
          <option value="encode">Encode</option>
          <option value="decode">Decode</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">Format</label>
        <select
          className={selectClass}
          value={mode}
          onChange={(e) => setMode(e.target.value as 'adobe' | 'raw')}
        >
          <option value="adobe">Adobe (&lt;~...~&gt;)</option>
          <option value="raw">Raw Base85</option>
        </select>
      </div>
    </>
  );

  return (
    <AdvancedConverter
      title="Base85 / Ascii85 Encoder &amp; Decoder"
      description="Encode or decode data using [1 Base85 (Ascii85) 2]. Groups 4 bytes into 5 ASCII characters. Special case: four zero bytes become [1 z 2]. Supports Adobe [1 &lt;~...~&gt; 2] delimiters and raw Base85."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="Output"
      extraElements={extraElements}
      backColor="yellow"
    />
  );
};
