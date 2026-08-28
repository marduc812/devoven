'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { solveEquation } from './logic';

export function EquationSolver() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    setOutput(solveEquation(input));
  }, [input]);

  return (
    <BasicConverter
      title="Equation Solver"
      description="Solve linear, quadratic, or 2×2 systems. Enter one equation like [1 2x + 3 = 7 2] or [1 x^2 + 5x + 6 = 0 2]. For a system, enter two equations on separate lines. No eval() used."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Equation(s)"
      toTitle="Step-by-step Solution"
      backColor="lime"
    />
  );
}
