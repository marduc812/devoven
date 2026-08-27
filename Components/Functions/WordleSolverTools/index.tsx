'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatWordleSolver } from './logic';

export function WordleSolverHelper() {
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
      setOutput(formatWordleSolver(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Wordle Solver Helper"
      description="Filter possible Wordle answers from your constraints. Enter [1 green: .A.LE 2] for known positions, [1 yellow: T,R 2] for letters in wrong positions, and [1 gray: S,N,D 2] for eliminated letters. Results sorted by letter frequency."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Constraints (one per line)"
      toTitle="Possible Words"
      backColor="rose"
    />
  );
}
