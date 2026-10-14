'use client';

import { useEffect, useMemo, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatIndexOfCoincidence } from './logic';

export function IndexOfCoincidenceCalculator() {
  const [input, setInput] = useState('');
  useEffect(() => { setInput(new URLSearchParams(window.location.search).get('from') ?? ''); }, []);
  const output = useMemo(() => input ? formatIndexOfCoincidence(input) : '', [input]);
  return <BasicConverter
    title="Index of Coincidence"
    description="Measure the probability that two letters chosen at different positions match. Counts A-Z letters without case distinctions and ignores other characters. Reports the raw probability and its value multiplied by 26. Short samples can give misleading results; this statistic does not identify a cipher by itself."
    fromValue={input} toValue={output} setFromValue={setInput}
    fromTitle="Text" toTitle="Coincidence report" backColor="lime"
  />;
}
