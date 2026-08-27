'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { extractEntities, formatEntities } from './logic';

export function EntityExtractor() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const entities = extractEntities(input);
    setOutput(formatEntities(entities));
  }, [input]);

  return (
    <BasicConverter
      title="Entity Extractor"
      description="Extract structured data from free text using pattern matching. Finds emails, URLs, phone numbers, IP addresses, dates, credit cards (masked), hashtags, @mentions, and numbers."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Extracted Entities"
      backColor="rose"
    />
  );
}
