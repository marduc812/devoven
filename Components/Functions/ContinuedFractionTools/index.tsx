'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { computeContinuedFractionResult } from './logic';

export function ContinuedFractionCalc() {
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
      setOutput(computeContinuedFractionResult(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Continued Fraction Calculator"
      description="Compute the continued fraction representation of any decimal or fraction (e.g. [1 3.14159 2] or [1 22/7 2]). Shows CF notation [a₀; a₁, a₂, ...], convergents, and rational approximations. Famous constants (π, e, √2, φ) are shown as reference."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Number (decimal or fraction)"
      toTitle="Continued Fraction"
      backColor="lime"
    />
  );
}
