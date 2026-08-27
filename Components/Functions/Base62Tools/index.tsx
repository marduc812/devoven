'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { base62EncodeText, base62DecodeText, base62EncodeNumber, base62DecodeNumber } from './logic';

type EncodeMode = 'text' | 'number';

export const Base62Encoder = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<EncodeMode>('text');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(mode === 'text' ? base62EncodeText(fromValue) : base62EncodeNumber(fromValue));
    } catch (e: unknown) {
      setToValue(e instanceof Error ? e.message : 'Encoding error');
    }
  }, [fromValue, mode]);

  const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <div className="flex items-center gap-2">
      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider whitespace-nowrap">Input Type</label>
      <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as EncodeMode)}>
        <option value="text">Text</option>
        <option value="number">Integer</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="Base62 Encoder"
      description="Encode text or integers to [1 Base62 2] (0–9, A–Z, a–z). Used in [1 URL shorteners 2] and compact IDs. Text mode encodes raw bytes; integer mode encodes a decimal number to a [1 compact Base62 representation 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="Base62 Output"
      extraElements={extraElements}
      backColor="yellow"
    />
  );
};

export const Base62Decoder = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<EncodeMode>('text');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(mode === 'text' ? base62DecodeText(fromValue) : base62DecodeNumber(fromValue));
    } catch (e: unknown) {
      setToValue(e instanceof Error ? e.message : 'Decoding error');
    }
  }, [fromValue, mode]);

  const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  const extraElements = (
    <div className="flex items-center gap-2">
      <label className="text-gray-500 text-xs font-bold uppercase tracking-wider whitespace-nowrap">Output Type</label>
      <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as EncodeMode)}>
        <option value="text">Text</option>
        <option value="number">Integer</option>
      </select>
    </div>
  );

  return (
    <AdvancedConverter
      title="Base62 Decoder"
      description="Decode [1 Base62 2] (0–9, A–Z, a–z) back to text or integers. Paste a Base62 string to recover the original text or the [1 decimal integer 2] it represents."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Base62 Input"
      toTitle="Output"
      extraElements={extraElements}
      backColor="yellow"
    />
  );
};

// Keep old combined export for any existing references

