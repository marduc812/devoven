'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { analyzeSemver, formatSemverResult } from './logic';

export function SemverBumper() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const result = analyzeSemver(input);
      setOutput(formatSemverResult(result));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Semantic Versioning Bumper"
      description="Enter your [1 current version 2] on the first line, then one [1 conventional commit message 2] per line. Parses feat!, feat, fix, chore, etc. to suggest the next semver bump (major/minor/patch)."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Current Version + Commit Messages (one per line)"
      toTitle="Suggested Version Bump"
      backColor="lime"
    />
  );
}
