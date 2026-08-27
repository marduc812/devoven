'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { dateDiff } from './logic';

export function DateDiffCalculator() {
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
      const lines = input.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        setOutput('Enter two dates, one per line (e.g. 2024-01-01)');
        return;
      }
      setOutput(dateDiff(lines[0], lines[1]));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Date Difference Calculator"
      description="Enter two dates (one per line) in [1 YYYY-MM-DD 2] format to calculate the difference in days, weeks, months, and years."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Dates (one per line)"
      toTitle="Result"
      backColor="lime"
    />
  );
}
