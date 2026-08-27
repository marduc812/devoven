'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { convertScientific } from './logic';

export function ScientificNotationConverter() {
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
      setOutput(convertScientific(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Scientific Notation Converter"
      description="Convert a [1 decimal number 2] to scientific, engineering, and exponential notation. Also parses [1 1.5e+3 2] back to a plain number."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Number"
      toTitle="Result"
      backColor="cyan"
    />
  );
}
