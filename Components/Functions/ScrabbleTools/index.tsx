'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatScrabbleOutput } from './logic';

export function ScrabbleScorer() {
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
      setOutput(formatScrabbleOutput(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Scrabble Word Scorer"
      description="Calculate Scrabble scores for words or text. Enter a word like [1 QUIZ 2] or multiple words. Shows per-letter scores, total score, highest-scoring words, and letter value distribution."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Word or Text"
      toTitle="Score Breakdown"
      backColor="rose"
    />
  );
}
