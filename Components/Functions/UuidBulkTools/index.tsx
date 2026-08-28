'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatUuidBulk } from './logic';

export function UuidBulkGenerator() {
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
      setOutput(formatUuidBulk(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="UUID Bulk Generator"
      description="Enter a number to generate that many UUIDs. Supports up to [1 1000 2] UUIDs at a time."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Count"
      toTitle="Generated UUIDs"
      backColor="lime"
    />
  );
}
