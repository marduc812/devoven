'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processLinearRegression } from './logic';

export function LinearRegressionCalculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(function() {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(function() {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processLinearRegression(input));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Linear Regression Calculator"
      description="Enter [1 X,Y data pairs 2] — one per line, comma separated (e.g. [1 1,2 2]). Optionally add a line [1 predict: X 2] to compute Y for a given X. Outputs slope, intercept, R², Pearson r, step-by-step formulas, and a residuals table."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="X,Y pairs (one per line, comma separated)"
      toTitle="Regression Results"
      backColor="lime"
    />
  );
}
