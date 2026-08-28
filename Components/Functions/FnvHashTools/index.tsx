'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { computeFnvAll, formatFnvResult } from './logic';

export const FnvHashCalculator = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    try {
      const result = computeFnvAll(fromValue);
      setToValue(formatFnvResult(result));
    } catch {
      setToValue('Error computing hash');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="FNV Hash Calculator"
      description="Compute [1 FNV-1 2] and [1 FNV-1a 2] hashes in both 32-bit and 64-bit. FNV (Fowler–Noll–Vo) is a fast [1 non-cryptographic 2] hash used in hash tables, compilers, and networking. FNV-1a has better [1 avalanche properties 2] than FNV-1."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input Text"
      toTitle="Hash Results"
      backColor="teal"
    />
  );
};
