'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { textToAsciiArt } from './logic';

export function AsciiArtConverter() {
  const [input, setInput] = useState('Hello');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(textToAsciiArt(input));
  }, [input]);

  return (
    <BasicConverter
      title="Text to ASCII Art"
      description="Convert text to ASCII art using a block letter font. Supports [1 A-Z 2], [1 0-9 2], and spaces. Enter your text to see it transformed."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Text"
      toTitle="ASCII Art"
      backColor="lime"
    />
  );
}
