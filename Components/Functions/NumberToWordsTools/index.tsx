'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { numberToWords } from './logic';

export const NumberToWords = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') || '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(numberToWords(fromValue));
    } catch (e: unknown) {
      setToValue(fromValue ? (e instanceof Error ? e.message : 'Invalid number') : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Number to Words Converter"
      description="Convert a number to English words. For example, [1 1234 2] becomes [1 one thousand two hundred thirty-four 2]. Supports negatives and decimals."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Number"
      toTitle="Words"
      backColor="cyan"
    />
  );
};
