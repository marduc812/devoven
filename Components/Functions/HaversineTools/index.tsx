'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseCoordsInput } from './logic';

export function HaversineDistance() {
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
      setOutput(parseCoordsInput(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Haversine Distance Calculator"
      description="Calculate the great-circle distance between two geographic coordinates. Enter two points, one per line, as [1 lat,lon 2] (e.g. 51.5074,-0.1278)."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Coordinates (lat,lon — one per line)"
      toTitle="Distance"
      backColor="lime"
    />
  );
}
