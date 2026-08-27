'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatShadesOutput } from './logic';

export function TailwindShades() {
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
      const lines = input.split('\n').map(l => l.trim()).filter(l => l);
      const hexLine = lines[0] || '';
      const nameLine = lines[1] || 'custom';
      setOutput(formatShadesOutput(nameLine, hexLine));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Tailwind CSS Color Shades Generator"
      description="Enter a [1 base hex color 2] on line 1 and an optional [1 color name 2] on line 2. Generates a full Tailwind-style shade palette (50–950) with CSS custom properties and Tailwind config snippet."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Hex Color (line 1) / Name (line 2, optional)"
      toTitle="Generated Shades"
      backColor="cyan"
    />
  );
}
