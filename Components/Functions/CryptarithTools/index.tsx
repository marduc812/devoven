'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatCryptarithOutput } from './logic';

export function CryptarithSolver() {
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
      setOutput(formatCryptarithOutput(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Cryptarithmetic Solver"
      description="Solve cryptarithmetic puzzles where letters represent unique digits. Enter a puzzle like [1 SEND + MORE = MONEY 2]. Each unique letter maps to a unique digit 0–9. Leading digits cannot be 0. Supports up to 8 unique letters."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Puzzle (e.g. SEND + MORE = MONEY)"
      toTitle="Solutions"
      backColor="lime"
    />
  );
}
