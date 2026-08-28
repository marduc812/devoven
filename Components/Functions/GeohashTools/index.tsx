'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processGeohashInput } from './logic';

export function GeohashTool() {
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
      setOutput(processGeohashInput(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Geohash Encoder / Decoder"
      description="Encode [1 latitude/longitude 2] to a geohash string or decode a [1 geohash 2] back to coordinates. Input is auto-detected — enter a lat/lon pair like [1 48.8566, 2.3522 2] or a geohash like [1 u09tvw0 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Geohash or Lat/Lon"
      toTitle="Result"
      backColor="lime"
    />
  );
}
