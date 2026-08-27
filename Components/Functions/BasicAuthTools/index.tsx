'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processBasicAuth } from './logic';

export function BasicAuthEncoderDecoder() {
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
      setOutput(processBasicAuth(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="HTTP Basic Auth Encoder / Decoder"
      description="Encode [1 username:password 2] into a Basic auth header, or decode a [1 Basic <token> 2] header back to credentials. Auto-detects direction."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (user:pass or Basic token)"
      toTitle="Result"
      backColor="yellow"
    />
  );
}
