'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { convertGpsCoords } from './logic';

export function GpsCoordsConverter() {
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
      setOutput(convertGpsCoords(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="GPS Coordinate Converter"
      description={"Convert GPS coordinates between [1 Decimal Degrees (DD) 2], [1 Degrees Minutes Seconds (DMS) 2], and [1 Degrees Decimal Minutes (DDM) 2]. Accepts any common format — e.g. [1 48.8566\u00b0N, 2.3522\u00b0E 2] or [1 48\u00b051'24\"N, 2\u00b021'8\"E 2]."}
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Coordinates (any format)"
      toTitle="All Formats"
      backColor="lime"
    />
  );
}
