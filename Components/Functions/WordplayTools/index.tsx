'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatWordplayOutput } from './logic';

export function WordplayGenerator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    setOutput(formatWordplayOutput(input));
  }, [input]);

  return (
    <BasicConverter
      title="Wordplay Generator"
      description="Enter a word to explore wordplay possibilities: [1 anagrams 2], [1 rhymes 2], [1 alliterations 2], [1 hidden words 2] within the word, and [1 near-palindromes 2]. Try words like [1 listen 2], [1 silent 2], [1 stressed 2] or [1 desserts 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Enter a Word"
      toTitle="Wordplay Results"
      backColor="rose"
    />
  );
}
