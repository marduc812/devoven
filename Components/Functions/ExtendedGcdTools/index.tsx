'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { calculateExtendedGcd } from './logic';

export function ExtendedGcd() {
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
      setToValue(calculateExtendedGcd(fromValue));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Extended Euclidean Algorithm"
      description="Find the GCD of two integers and the [1 Bézout coefficients 2] x, y such that ax + by = gcd(a, b). Also computes modular inverses when gcd = 1."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Two Integers (e.g. 35 15)"
      toTitle="Result"
      backColor="lime"
    />
  );
}
