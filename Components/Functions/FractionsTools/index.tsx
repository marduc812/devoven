'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { calculateFraction } from './logic';

export function FractionCalculator() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(calculateFraction(fromValue));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Fraction Calculator"
      description="Calculate fraction arithmetic with step-by-step working. Enter an expression like [1 3/4 + 1/6 2] or [1 2/3 * 4/5 2]. Supports +, -, *, / operations. Result is shown reduced and as decimal."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Fraction Expression (e.g. 3/4 + 1/6)"
      toTitle="Step-by-Step Result"
      backColor="lime"
    />
  );
}
