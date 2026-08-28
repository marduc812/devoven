'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { computeAstronomy } from './logic';

export function AstronomyCalculator() {
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
      setOutput(computeAstronomy(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Astronomical Calculator"
      description="Calculate [1 sunrise 2], [1 sunset 2], [1 solar noon 2], day length, solar declination, equation of time, and moon phase. Enter a date and location: [1 YYYY-MM-DD lat, lon 2] e.g. [1 2025-06-21 51.5, -0.1 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Date and Location (YYYY-MM-DD lat, lon)"
      toTitle="Solar & Lunar Data"
      backColor="lime"
    />
  );
}
