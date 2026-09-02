'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  findDuplicateWords,
  findDuplicateLines,
  findNearDuplicates,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

type Mode = 'words' | 'lines' | 'near';

export function DuplicateFinder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<Mode>('words');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode') as Mode;
    if (m) setMode(m);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    if (mode === 'words') setOutput(findDuplicateWords(input));
    else if (mode === 'lines') setOutput(findDuplicateLines(input));
    else setOutput(findNearDuplicates(input));
  }, [input, mode]);

  return (
    <AdvancedConverter
      title="Duplicate Finder"
      description="Find duplicate words, lines, or near-duplicate lines in your text. For example, pasting a paragraph will reveal all repeated words like [1 the 2] or [1 and 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input Text"
      toTitle="Results"
      backColor="rose"
      extraElements={
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
          className={selectClass}
        >
          <option value="words">Duplicate Words</option>
          <option value="lines">Duplicate Lines</option>
          <option value="near">Near Duplicates</option>
        </select>
      }
    />
  );
}
