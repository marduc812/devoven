'use client';

import React, { useState, useMemo } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { useTimeboxedWorker, DEFAULT_TIMEOUT_MS } from '@/Components/Functions/useTimeboxedWorker';
import { spawnRegexWorker } from '@/lib/regex/spawn';
import type { RegexTestJob } from '@/lib/regex/types';
import { testRegex, type RegexFlags, type RegexTestResult } from './logic';

export const RegexTesterTool = () => {
  const [pattern, setPattern] = useState('');
  const [testString, setTestString] = useState('');
  const [flags, setFlags] = useState<RegexFlags>({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
  });

  // The match runs in a worker: a pattern like `(a+)+$` backtracks for minutes
  // on a few dozen characters, and a running RegExp cannot be interrupted -
  // only the worker holding it can be killed.
  const job = useMemo<RegexTestJob | null>(
    () => (pattern || testString ? { kind: 'test', pattern, text: testString, flags } : null),
    [pattern, testString, flags],
  );

  const run = useTimeboxedWorker<RegexTestJob, RegexTestResult>({
    spawn: spawnRegexWorker,
    request: job,
    fallback: (j) => testRegex(j.pattern, j.text, j.flags),
  });

  const result = run.result;
  // Match positions belong to the text they were found in. While a slow run is
  // still going, the previous result is what is on screen, so the highlighting
  // waits rather than pointing at offsets in text that has since changed.
  const resultMatchesText = run.source?.text === testString;

  const textareaClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm resize-none';

  const flagKeys: { key: keyof RegexFlags; label: string; desc: string }[] = [
    { key: 'global', label: 'g', desc: 'Global — find all matches' },
    { key: 'ignoreCase', label: 'i', desc: 'Ignore case' },
    { key: 'multiline', label: 'm', desc: 'Multiline — ^ and $ match line boundaries' },
    { key: 'dotAll', label: 's', desc: 'Dot all — . matches newlines' },
  ];

  const highlightMatches = (text: string): React.JSX.Element[] => {
    if (!result || !result.isValid || result.matches.length === 0) {
      return [<span key="text">{text}</span>];
    }
    const parts: React.JSX.Element[] = [];
    let lastIndex = 0;
    for (const m of result.matches) {
      if (m.index > lastIndex) {
        parts.push(<span key={'pre-' + m.index}>{text.slice(lastIndex, m.index)}</span>);
      }
      parts.push(
        <mark
          key={'match-' + m.index}
          className="bg-emerald-500/30 text-emerald-200 rounded"
        >
          {m.match}
        </mark>
      );
      lastIndex = m.endIndex;
    }
    if (lastIndex < text.length) {
      parts.push(<span key="post">{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  return (
    <Panel
      title="Regex Tester"
      description="Test regular expressions in real time. Enter a pattern and test string to see all matches, positions, and capture groups. Supports flags: [1 g 2] global, [1 i 2] ignore case, [1 m 2] multiline, [1 s 2] dot-all."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          {/* Pattern input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Regex Pattern</label>
            <input
              className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm"
              placeholder="e.g. \b\w+@\w+\.\w+\b"
              value={pattern}
              onChange={e => setPattern(e.target.value)}
            />
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-3">
            {flagKeys.map(f => (
              <label
                key={f.key}
                className="flex items-center gap-2 cursor-pointer select-none"
                title={f.desc}
              >
                <input
                  type="checkbox"
                  checked={flags[f.key]}
                  onChange={e => setFlags(prev => ({ ...prev, [f.key]: e.target.checked }))}
                  className="accent-emerald-400"
                />
                <span className="font-mono text-emerald-300 text-sm">{f.label}</span>
                <span className="text-gray-500 text-xs">{f.desc}</span>
              </label>
            ))}
          </div>

          {/* Test string */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Test String</label>
            <FileTextArea>
              <textarea
                className={textareaClass}
                rows={5}
                placeholder="Enter text to test the regex against..."
                value={testString}
                onChange={e => setTestString(e.target.value)}
              />
            </FileTextArea>
          </div>

          {/* Error */}
          {run.timedOut && (
            <p className="text-red-400 text-sm font-mono">
              Stopped after {DEFAULT_TIMEOUT_MS / 1000} seconds — this pattern backtracks
              catastrophically on this text.
            </p>
          )}

          {result && !result.isValid && (
            <p className="text-red-400 text-sm font-mono">{result.error}</p>
          )}

          {/* Highlighted preview */}
          {result && result.isValid && resultMatchesText && testString && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Preview ({result.matchCount} match{result.matchCount !== 1 ? 'es' : ''})
              </p>
              <div className="bg-gray-50 text-gray-900 p-3 border border-gray-200 font-mono text-xs whitespace-pre-wrap break-all">
                {highlightMatches(testString)}
              </div>
            </div>
          )}

          {/* Match details */}
          {result && result.isValid && resultMatchesText && result.matches.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Match Details</p>
              <div className="flex flex-col gap-2">
                {result.matches.map((m, i) => (
                  <div key={i} className="border border-gray-200 bg-gray-50 p-3 text-xs font-mono">
                    <div className="flex gap-4 mb-1">
                      <span className="text-gray-500">#{i + 1}</span>
                      <span className="text-gray-900">{JSON.stringify(m.match)}</span>
                      <span className="text-gray-500">pos {m.index}–{m.endIndex}</span>
                    </div>
                    {m.captureGroups.length > 0 && (
                      <div className="text-gray-400 mt-1">
                        Groups: {m.captureGroups.map((g, gi) => (
                          <span key={gi} className="mr-2">
                            <span className="text-gray-400">${gi + 1}=</span>
                            <span className="text-emerald-300">{g === undefined ? 'undefined' : JSON.stringify(g)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                    {m.groups && Object.keys(m.groups).length > 0 && (
                      <div className="text-gray-400 mt-1">
                        Named: {Object.entries(m.groups).map(([k, v]) => (
                          <span key={k} className="mr-2">
                            <span className="text-gray-400">{k}=</span>
                            <span className="text-emerald-300">{v === undefined ? 'undefined' : JSON.stringify(v)}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && result.isValid && resultMatchesText && pattern && testString && result.matches.length === 0 && (
            <p className="text-gray-500 text-sm">No matches found.</p>
          )}
        </div>
      }
    />
  );
};
