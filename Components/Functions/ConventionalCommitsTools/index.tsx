'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseCommitInput, getCommitTemplate } from './logic';

export function ConventionalCommitsBuilder() {
  const [input, setInput] = useState(getCommitTemplate());
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(parseCommitInput(input));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Conventional Commits Builder"
      description="Build a [1 conventional commit message 2] from a key-value template. Supports type, scope, breaking, description, body, and footer fields."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Commit Fields"
      toTitle="Commit Message"
      backColor="lime"
    />
  );
}
