'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { decimalToFraction, formatFractionResult } from './logic';

export const DecimalToFraction = () => {
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
      const result = decimalToFraction(fromValue);
      toValue = formatFractionResult(result);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  return (
    <BasicConverter
      title="Decimal to Fraction"
      description="Convert any [1 decimal number 2] to its simplest fraction. Shows the fraction, percentage, ratio, and [1 continued fraction expansion 2]. Handles repeating decimals like [1 0.333... → 1/3 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Decimal Number"
      toTitle="Fraction & Details"
      backColor="cyan"
    />
  );
};
