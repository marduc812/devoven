'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeText, classifyChar, type CharCategory } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const CATEGORY_STYLE: Record<CharCategory, { bar: string; text: string; label: string }> = {
  letter:      { bar: 'bg-gray-900',    text: 'text-gray-900',    label: 'letters' },
  digit:       { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'digits' },
  whitespace:  { bar: 'bg-gray-300',    text: 'text-gray-400',    label: 'whitespace' },
  punctuation: { bar: 'bg-amber-400',   text: 'text-amber-600',   label: 'punctuation' },
  other:       { bar: 'bg-indigo-400',  text: 'text-indigo-500',  label: 'other' },
};

export const CharFrequencyTools = () => {
  const [text, setText] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from');
    if (from) setText(from);
    if (params.get('case') === 'insensitive') setIgnoreCase(true);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: text, case: ignoreCase })

  const analysis = useMemo(
    () => (text ? analyzeText(text, { ignoreCase, ignoreWhitespace }) : null),
    [text, ignoreCase, ignoreWhitespace],
  );

  const topCount = analysis && analysis.entries.length > 0 ? analysis.entries[0].count : 1;
  const letterPeak = analysis ? Math.max(...analysis.letters.map(l => l.count), 1) : 1;
  const visible = analysis ? (showAll ? analysis.entries : analysis.entries.slice(0, 24)) : [];

  const checkboxClass = 'accent-gray-900 w-4 h-4';

  return (
    <Panel
      title="Character Frequency Counter"
      description="Paste any text to see which characters carry it. Gives a ranked [1 frequency table 2] with counts and percentages, a breakdown by character class, and an A–Z map — the starting point for a [1 substitution cipher 2] or for spotting stray control characters."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input */}
          <div>
            <label className={`${labelClass} block mb-1`}>Input Text</label>
            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full h-40 border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm resize-y"
                placeholder="Paste text here…"
                value={text}
                onChange={e => setText(e.target.value)}
                aria-label="Input text"
              />
            </FileTextArea>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={ignoreCase}
                onChange={e => setIgnoreCase(e.target.checked)}
              />
              Fold case together
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={ignoreWhitespace}
                onChange={e => setIgnoreWhitespace(e.target.checked)}
              />
              Ignore whitespace
            </label>
          </div>

          {analysis && analysis.total === 0 && (
            <div className="border border-gray-200 px-4 py-3 text-gray-500 text-sm font-mono">
              Nothing left to count with these options.
            </div>
          )}

          {analysis && analysis.total > 0 && (
            <>
              {/* Headline */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
                <div className="bg-gray-900 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">Characters</p>
                  <p className="text-2xl font-black text-white">{analysis.total.toLocaleString('en-US')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">counted</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Distinct</p>
                  <p className="text-2xl font-black text-gray-900">{analysis.unique}</p>
                  <p className="text-xs text-gray-400 mt-0.5">unique characters</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Most Common</p>
                  <p className="text-2xl font-black text-gray-900 font-mono truncate">
                    {analysis.entries[0].display}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {analysis.entries[0].count}× · {analysis.entries[0].percent.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Repetition</p>
                  <p className="text-2xl font-black text-gray-900">
                    {(analysis.total / analysis.unique).toFixed(1)}×
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">uses per character</p>
                </div>
              </div>

              {/* Category split */}
              <div>
                <p className={`${labelClass} mb-2`}>Character Classes</p>
                <div className="flex h-8 border border-gray-200 overflow-hidden">
                  {analysis.categories.map(c => (
                    <div
                      key={c.name}
                      className={CATEGORY_STYLE[c.name].bar}
                      style={{ width: `${c.percent}%` }}
                      title={`${CATEGORY_STYLE[c.name].label}: ${c.count} (${c.percent.toFixed(1)}%)`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                  {analysis.categories.map(c => (
                    <span key={c.name} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      <span className={`w-3 h-2 inline-block ${CATEGORY_STYLE[c.name].bar}`} />
                      {CATEGORY_STYLE[c.name].label}
                      <span className="font-mono normal-case text-gray-500">
                        {c.count} · {c.percent.toFixed(1)}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* A–Z map */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  A–Z Map{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (case folded, share of letters only)
                  </span>
                </p>
                <div
                  className="grid gap-px bg-gray-200 border border-gray-200"
                  style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
                >
                  {analysis.letters.map(l => {
                    const intensity = l.count === 0 ? 0 : 0.12 + 0.88 * (l.count / letterPeak);
                    return (
                      <div
                        key={l.letter}
                        className="bg-white text-center py-1.5 relative"
                        title={`${l.letter}: ${l.count} (${l.percent.toFixed(2)}% of letters)`}
                      >
                        <span
                          className="absolute inset-0 bg-emerald-500"
                          style={{ opacity: intensity }}
                          aria-hidden
                        />
                        <span className="relative block text-xs font-black text-gray-900">{l.letter}</span>
                        <span className="relative block text-[10px] font-mono text-gray-700">{l.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ranked table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={labelClass}>Frequency Table</p>
                  {analysis.entries.length > 24 && (
                    <button
                      className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
                      onClick={() => setShowAll(v => !v)}
                    >
                      {showAll ? 'Show top 24' : `Show all ${analysis.entries.length}`}
                    </button>
                  )}
                </div>
                <div className={`border border-gray-200 divide-y divide-gray-100 ${showAll ? 'max-h-96 overflow-y-auto' : ''}`}>
                  {visible.map((e, i) => {
                    const style = CATEGORY_STYLE[classifyChar(e.char)];
                    return (
                      <div key={`${e.char}-${i}`} className="flex items-center gap-3 px-3 py-1.5">
                        <span className="font-mono text-xs text-gray-400 w-6 flex-shrink-0 text-right">{i + 1}</span>
                        <span className="font-mono text-sm text-gray-900 w-20 flex-shrink-0 truncate" title={e.display}>
                          {e.display}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400 w-14 flex-shrink-0 hidden sm:block">
                          U+{e.char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}
                        </span>
                        <span className="flex-1 h-3 bg-gray-50 min-w-0">
                          <span
                            className={`block h-3 ${style.bar}`}
                            style={{ width: `${(e.count / topCount) * 100}%` }}
                          />
                        </span>
                        <span className="font-mono text-xs text-gray-900 w-14 text-right flex-shrink-0">{e.count}</span>
                        <span className={`font-mono text-xs w-16 text-right flex-shrink-0 ${style.text}`}>
                          {e.percent.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
