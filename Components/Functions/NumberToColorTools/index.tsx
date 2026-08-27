'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { generateColorVariants } from './logic';

export function NumberToColor() {
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
      setOutput(generateColorVariants(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Number to Color"
      description="Generate a deterministic hex color from any number or string. Useful for generating avatar colors from usernames. Try [1 alice 2] or [1 42 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Number or String"
      toTitle="Color Variants"
      backColor="cyan"
    />
  );
}
