'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { evaluateModularExpression, formatResult } from './logic';

export function ModularArith() {
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
      const r = evaluateModularExpression(fromValue);
      setToValue(formatResult(r));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Modular Arithmetic Calculator"
      description="Evaluate modular expressions like [1 17 mod 5 2], [1 2^10 mod 1000 2], or [1 (3 * 7) mod 11 2]. Supports addition, subtraction, multiplication, and fast exponentiation. Shows step-by-step calculation and modular inverse via extended Euclidean algorithm."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Expression (e.g. 2^10 mod 1000)"
      toTitle="Result"
      backColor="lime"
    />
  );
}
