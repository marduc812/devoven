'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatHomophoneOutput } from './logic';

export function HomophoneChecker() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(formatHomophoneOutput(input));
  }, [input]);

  return (
    <BasicConverter
      title="Homophones & Confusables Checker"
      description="Detect commonly confused word pairs in your text. Checks for 80+ pairs like [1 their/there/they're 2], [1 affect/effect 2], [1 lose/loose 2], [1 principle/principal 2] and more. Each match shows the full confused set and explanation."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Confusable Words Found"
      backColor="rose"
    />
  );
}
