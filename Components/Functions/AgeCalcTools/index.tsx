'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { calculateAge, formatAgeResult } from './logic';

export function AgeCalculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const result = calculateAge(input.trim());
      setOutput(formatAgeResult(result));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Age Calculator"
      description="Enter a [1 date of birth 2] in YYYY-MM-DD format to calculate exact age in years, months, and days. Also shows total days lived, weeks, hours, next birthday, zodiac sign, and Chinese zodiac."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Date of Birth (YYYY-MM-DD)"
      toTitle="Results"
      backColor="lime"
    />
  );
}
