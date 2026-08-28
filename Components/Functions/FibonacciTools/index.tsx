'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatFibonacci } from './logic';

export function FibonacciGenerator() {
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
      setOutput(formatFibonacci(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Fibonacci Generator"
      description="Generate Fibonacci numbers. Enter the number of terms to generate (up to [1 1000 2]). Uses BigInt for exact large number precision."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Number of Terms"
      toTitle="Sequence"
      backColor="lime"
    />
  );
}
