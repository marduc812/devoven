'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { analyzeSoundex } from './logic';

export function TextSoundexConverter() {
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
      setOutput(analyzeSoundex(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Soundex & Phonetic Codes"
      description="Generate [1 Soundex 2], [1 Metaphone 2], and [1 Double Metaphone 2] codes for English words and names. Similar-sounding names share the same Soundex code — try [1 Robert 2] vs [1 Rupert 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Word or Name (one per line)"
      toTitle="Phonetic Codes"
      backColor="rose"
    />
  );
}
