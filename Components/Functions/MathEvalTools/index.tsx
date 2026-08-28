'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { evaluateInput } from './logic';

export function MathEvaluator() {
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
      setOutput(evaluateInput(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Safe Math Evaluator"
      description="Evaluate math expressions safely without using eval(). Supports [1 +, -, *, /, **, % 2], parentheses, and functions like [1 sqrt(), sin(), cos(), log() 2]. Use constants [1 pi 2] and [1 e 2]. Enter one expression per line."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Expressions"
      toTitle="Results"
      backColor="lime"
    />
  );
}
