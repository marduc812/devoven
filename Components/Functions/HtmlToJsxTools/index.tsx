'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { htmlToJsx } from './logic';

export function HtmlToJsxConverter() {
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
      setOutput(htmlToJsx(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="HTML to JSX Converter"
      description="Convert HTML to JSX syntax. Converts [1 class 2] to [1 className 2], [1 for 2] to [1 htmlFor 2], inline styles to objects, self-closes void elements, and converts HTML comments to JSX comments."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="HTML"
      toTitle="JSX"
      backColor="cyan"
    />
  );
}
