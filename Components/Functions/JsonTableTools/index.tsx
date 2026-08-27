'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { jsonToAsciiTable } from './logic';

export function JsonTableConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(jsonToAsciiTable(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="JSON to ASCII Table"
      description="Convert a JSON array of objects into a formatted [1 ASCII table 2]. Each key becomes a column header."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="JSON Input"
      toTitle="ASCII Table"
      backColor="cyan"
    />
  );
}
