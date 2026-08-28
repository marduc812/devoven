'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parsePercentageQuery } from './logic';

export function PercentageCalculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(parsePercentageQuery(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Percentage Calculator"
      description="Calculate percentages using natural language queries. Try [1 25% of 200 2], [1 50 is what % of 200 2], [1 100 increased by 15% 2], or [1 % change from 50 to 75 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Query"
      toTitle="Result"
      backColor="lime"
    />
  );
}
