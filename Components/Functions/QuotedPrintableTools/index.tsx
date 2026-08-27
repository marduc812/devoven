'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { autoConvert } from './logic';

export const QuotedPrintableConverter = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from');
      if (from) setFromValue(from);
    }
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = autoConvert(fromValue);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Conversion error';
    }
  }

  return (
    <BasicConverter
      title="Quoted-Printable Encoder / Decoder"
      description="Encode text to [1 Quoted-Printable 2] format (RFC 2045) or decode it back to plain text. Automatically detects direction — if input contains [1 =XX 2] sequences or soft line breaks it will decode."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="Output"
      backColor="yellow"
    />
  );
};
