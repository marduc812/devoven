'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { countWordFrequency, formatWordFrequency } from './logic';

export function WordFrequencyTools() {
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
      const result = countWordFrequency(fromValue);
      setToValue(formatWordFrequency(result));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Word Frequency Counter"
      description="Paste any text to see a [1 word frequency table 2] showing the top 50 words sorted by occurrence, with counts and percentages."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input Text"
      toTitle="Frequency Table"
      backColor="rose"
    />
  );
}
