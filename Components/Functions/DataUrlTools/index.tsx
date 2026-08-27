'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processDataUrl } from './logic';

export function DataUrlCreator() {
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
      setOutput(processDataUrl(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Data URL Creator"
      description="Convert plain text to a [1 data: URL 2] (base64 encoded), or paste an existing [1 data:text/plain;base64,... 2] to decode it."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Text or Data URL"
      toTitle="Result"
      backColor="cyan"
    />
  );
}
