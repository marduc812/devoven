'use client';

import React, { useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { diffJson, formatDiffResults } from './logic';

// ─── C1. JSON Diff ────────────────────────────────────────────────────────────

export const JsonDiff = () => {
  const [jsonA, setJsonA] = useState('');
  const [jsonB, setJsonB] = useState('');

  let diffOutput = '';
  if (jsonA.trim() && jsonB.trim()) {
    try {
      const diffs = diffJson(jsonA, jsonB);
      diffOutput = formatDiffResults(diffs);
    } catch (e: unknown) {
      diffOutput = e instanceof Error ? `Error: ${e.message}` : 'Invalid JSON input';
    }
  }

  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';

  const getDiffLineClass = (line: string) => {
    if (line.startsWith('+ ')) return 'text-emerald-400';
    if (line.startsWith('- ')) return 'text-red-400';
    if (line.startsWith('~ ')) return 'text-amber-400';
    return 'text-gray-400';
  };

  return (
    <Panel
      title="JSON Diff"
      description="Compare two [1 JSON 2] objects and display added [1 + 2], removed [1 - 2], and changed [1 ~ 2] fields."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">JSON A</label>
            <FileTextArea>
              <textarea
                className={textareaClass}
                placeholder={'{\n  "key": "value"\n}'}
                rows={6}
                value={jsonA}
                onChange={e => setJsonA(e.target.value)}
              />
            </FileTextArea>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">JSON B</label>
            <FileTextArea>
              <textarea
                className={textareaClass}
                placeholder={'{\n  "key": "changed"\n}'}
                rows={6}
                value={jsonB}
                onChange={e => setJsonB(e.target.value)}
              />
            </FileTextArea>
          </div>

          {diffOutput && (
            <>
              <div className="w-full h-px bg-gray-200" />
              <div className="flex flex-col gap-2">
                <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">Diff Result</label>
                <div className="bg-gray-50 p-3 border border-gray-200 font-mono text-sm">
                  {diffOutput.split('\n').map((line, i) => (
                    <div key={i} className={getDiffLineClass(line)}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
