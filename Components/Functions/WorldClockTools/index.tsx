'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatWorldClock } from './logic';

export function WorldClock() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    try {
      const isoString = input.trim() || new Date().toISOString();
      setOutput(formatWorldClock(isoString));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="World Clock"
      description="Enter an ISO date string to see the time in all major timezones. Leave blank to use the current time. Example: [1 2024-01-15T12:00:00Z 2]"
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="ISO Date (optional)"
      toTitle="World Times"
      backColor="lime"
    />
  );
}
