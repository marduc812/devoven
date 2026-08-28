'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { processSampleSize } from './logic';

export function SampleSizeCalculator() {
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
      setOutput(processSampleSize(input));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Sample Size Calculator"
      description="Enter three lines: [1 population size 2] (or &quot;infinite&quot;), [1 confidence level 2] (90, 95, or 99), [1 margin of error % 2] (e.g. 5). Uses the Cochran formula with finite population correction. Outputs required sample size and a comparison table."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Population (line 1), Confidence % (line 2), Margin of Error % (line 3)"
      toTitle="Sample Size Results"
      backColor="lime"
    />
  );
}
