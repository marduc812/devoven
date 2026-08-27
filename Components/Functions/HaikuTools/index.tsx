'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatHaikuOutput } from './logic';

export function HaikuValidator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    setOutput(formatHaikuOutput(input));
  }, [input]);

  return (
    <BasicConverter
      title="Haiku Validator"
      description="Validate a 3-line poem for the [1 5-7-5 2] syllable pattern. Shows syllable count per line and suggestions to fix it. You can also enter a single theme word like [1 spring 2], [1 ocean 2], or [1 moon 2] to generate a haiku."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Haiku (3 lines) or Theme Word"
      toTitle="Validation Result"
      backColor="rose"
    />
  );
}
