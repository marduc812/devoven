'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { TextInputPane } from '@/Components/View/FileInput';
import { DiffLine, WordSpan, diffTwoTexts, inlineWordDiff } from './logic';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1';

type RenderLine = {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
  spans?: WordSpan[];
};

function processLines(diffLines: DiffLine[]): RenderLine[] {
  const result: RenderLine[] = [];
  let i = 0;

  while (i < diffLines.length) {
    if (diffLines[i].type === 'unchanged') {
      result.push({ type: 'unchanged', text: diffLines[i].text });
      i++;
      continue;
    }

    // Collect the whole contiguous changed block, then split into removed/added
    const removedLines: string[] = [];
    const addedLines: string[] = [];
    while (i < diffLines.length && diffLines[i].type !== 'unchanged') {
      if (diffLines[i].type === 'removed') removedLines.push(diffLines[i].text);
      else addedLines.push(diffLines[i].text);
      i++;
    }

    // Render removed first, then added — apply word-level diff to matched pairs
    const maxPairs = Math.max(removedLines.length, addedLines.length);
    for (let k = 0; k < maxPairs; k++) {
      const rem = removedLines[k];
      const add = addedLines[k];
      if (rem !== undefined && add !== undefined) {
        const { aSpans, bSpans } = inlineWordDiff(rem, add);
        result.push({ type: 'removed', text: rem, spans: aSpans });
        result.push({ type: 'added', text: add, spans: bSpans });
      } else if (rem !== undefined) {
        result.push({ type: 'removed', text: rem });
      } else {
        result.push({ type: 'added', text: add });
      }
    }
  }

  return result;
}

function Spans({ spans, isRemoved }: { spans: WordSpan[]; isRemoved: boolean }) {
  return (
    <>
      {spans.map((span, i) => (
        <span
          key={i}
          className={
            span.type === 'diff'
              ? isRemoved
                ? 'bg-red-300 dark:bg-red-700 rounded-sm'
                : 'bg-green-300 dark:bg-green-700 rounded-sm'
              : undefined
          }
        >
          {span.text}
        </span>
      ))}
    </>
  );
}

export const TextDiff = () => {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [renderLines, setRenderLines] = useState<RenderLine[]>([]);

  useEffect(() => {
    if (!text1 && !text2) { setRenderLines([]); return; }
    try {
      setRenderLines(processLines(diffTwoTexts(text1, text2)));
    } catch {
      setRenderLines([{ type: 'unchanged', text: 'Error computing diff' }]);
    }
  }, [text1, text2]);

  const hasChanges = renderLines.some(l => l.type !== 'unchanged');
  const showIdentical = renderLines.length > 0 && !hasChanges && (text1 || text2);

  const content = (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInputPane
          label="Text 1"
          value={text1}
          onChange={setText1}
          placeholder="Paste the first text here, or drop a file..."
        />
        <TextInputPane
          label="Text 2"
          value={text2}
          onChange={setText2}
          placeholder="Paste the second text here, or drop a file..."
        />
      </div>

      {renderLines.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClass}>Diff</label>
            {showIdentical && (
              <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Texts are identical</span>
            )}
            {hasChanges && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                <span className="text-red-500">−{renderLines.filter(l => l.type === 'removed').length}</span>
                {' / '}
                <span className="text-green-600">+{renderLines.filter(l => l.type === 'added').length}</span>
              </span>
            )}
          </div>
          <div className="w-full border border-gray-300 dark:border-gray-700 font-mono text-sm overflow-auto max-h-[480px]">
            {renderLines.map((line, idx) => {
              const isAdded = line.type === 'added';
              const isRemoved = line.type === 'removed';
              return (
                <div
                  key={idx}
                  className={`flex px-3 py-0.5 leading-6 ${
                    isAdded
                      ? 'bg-green-50 dark:bg-green-950/60 text-green-900 dark:text-green-100'
                      : isRemoved
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-100'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <span className={`select-none mr-3 w-3 text-center flex-shrink-0 font-bold ${
                    isAdded ? 'text-green-600 dark:text-green-400' : isRemoved ? 'text-red-500 dark:text-red-400' : 'text-gray-300 dark:text-gray-700'
                  }`}>
                    {isAdded ? '+' : isRemoved ? '-' : ' '}
                  </span>
                  <span className="whitespace-pre-wrap break-words min-w-0 flex-1">
                    {line.spans
                      ? <Spans spans={line.spans} isRemoved={isRemoved} />
                      : (line.text || ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="Text Diff"
      description="Compare two texts line by line. Removed lines are [1 highlighted red 2], added lines [1 highlighted green 2]. Changed words are further highlighted within each line."
      extraElements={content}
      backColor="rose"
    />
  );
};
