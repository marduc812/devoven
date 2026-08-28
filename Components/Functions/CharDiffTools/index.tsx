'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { charDiff, wordDiff, diffStats, renderDiffToText } from './logic';

export const CharDiff = () => {
  const [original, setOriginal] = useState('');
  const [revised, setRevised] = useState('');
  const [mode, setMode] = useState<'char' | 'word'>('word');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') || '';
      if (from) setOriginal(from);
    }
  }, []);

  useEffect(() => {
    if (!original && !revised) {
      setToValue('');
      return;
    }
    try {
      const charSegs = charDiff(original, revised);
      const wordSegs = wordDiff(original, revised);
      const stats = diffStats(charSegs, wordSegs);

      const diffView = mode === 'char'
        ? renderDiffToText(charSegs)
        : renderDiffToText(wordSegs);

      const statsText = [
        '',
        '=== Stats ===',
        `Chars added:    +${stats.charsAdded}`,
        `Chars removed:  -${stats.charsRemoved}`,
        `Words added:    +${stats.wordsAdded}`,
        `Words removed:  -${stats.wordsRemoved}`,
        `Similarity:     ${stats.similarity}%`,
      ].join('\n');

      setToValue(diffView + statsText);
    } catch (e: unknown) {
      setToValue(e instanceof Error ? e.message : 'Error computing diff');
    }
  }, [original, revised, mode]);

  const fromValue = `=== Original ===\n${original}\n\n=== Revised ===\n${revised}`;

  const selectClass =
    'bg-white text-gray-900 px-3 py-1.5 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm';

  const extraElements = (
    <div className="flex flex-wrap gap-4 items-start">
      <div className="flex flex-col gap-1.5 flex-1 min-w-48">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Original Text</label>
        <textarea
          className="bg-white text-gray-900 px-3 py-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm resize-none font-mono"
          rows={4}
          value={original}
          onChange={e => setOriginal(e.target.value)}
          placeholder="Paste original text here…"
        />
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-48">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Revised Text</label>
        <textarea
          className="bg-white text-gray-900 px-3 py-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm resize-none font-mono"
          rows={4}
          value={revised}
          onChange={e => setRevised(e.target.value)}
          placeholder="Paste revised text here…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-gray-400 uppercase tracking-wider">Diff Mode</label>
        <select
          className={selectClass}
          value={mode}
          onChange={e => setMode(e.target.value as 'char' | 'word')}
        >
          <option value="word">Word-level</option>
          <option value="char">Character-level</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="Text Diff Highlighter"
      description="Compare two texts at [1 word 2] or [1 character 2] level. Additions are shown as [1 [+added+] 2], deletions as [1 [-removed-] 2]. Shows similarity percentage and change stats."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={() => {}}
      fromTitle="Comparison"
      toTitle="Diff Output"
      backColor="rose"
      extraElements={extraElements}
    />
  );
};
