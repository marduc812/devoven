'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { romanCalculate } from './logic';

export const RomanCalculator = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = romanCalculate(fromValue);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  return (
    <BasicConverter
      title="Roman Numeral Calculator"
      description="Perform arithmetic with roman numerals. Enter an expression like [1 XIV + VI 2] to calculate."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Expression"
      toTitle="Result"
      backColor="cyan"
    />
  );
};
