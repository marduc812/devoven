'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { convertOrdinals } from './logic';

export function OrdinalTools() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(convertOrdinals(fromValue));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Ordinal Number Converter"
      description="Enter one or more integers (one per line) to convert them to [1 ordinal numbers 2] like 1st, 2nd, 3rd. Numbers under 100 also show the word form (e.g. first, second)."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Numbers (one per line)"
      toTitle="Ordinal Output"
      backColor="rose"
    />
  );
}
