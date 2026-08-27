'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processCorrelation } from './logic';

export function CorrelationCalculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(function() {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(function() {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processCorrelation(input));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Correlation Coefficient Calculator"
      description="Enter two columns of numbers (x, y) separated by comma or tab, one pair per line. Computes Pearson [1 r 2], [1 r² 2] (coefficient of determination), Spearman ρ, regression slope and intercept, and interpretation."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Data (x, y pairs — one per line)"
      toTitle="Correlation Results"
      backColor="lime"
    />
  );
}
