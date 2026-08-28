'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processInput } from './logic';

export const NumberSequence = () => {
  const [fromValue, setFromValue] = useState('fibonacci 10');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  const toValue = processInput(fromValue);

  return (
    <BasicConverter
      title="Number Sequence Generator"
      description="Generate number sequences by typing a command: [1 fibonacci 10 2], [1 primes 20 2], [1 squares 15 2], [1 triangular 10 2], [1 arithmetic 1 2 10 2], [1 geometric 2 3 8 2], [1 powers 2 16 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Command"
      toTitle="Sequence Output"
      backColor="lime"
    />
  );
};
