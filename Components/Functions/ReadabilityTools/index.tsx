'use client';

import { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { analyzeText } from './logic';

export const ReadabilityAnalyzer = () => {
  const [fromValue, setFromValue] = useState('');

  const toValue = analyzeText(fromValue);

  return (
    <BasicConverter
      title="Readability Analyzer"
      description="Analyze text for readability using Flesch-Kincaid Grade Level and Flesch Reading Ease. Paste any text to get statistics on sentence complexity, word frequency, and reading level."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input Text"
      toTitle="Analysis"
      backColor="rose"
    />
  );
};
