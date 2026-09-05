'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileDropZone, LoadFileButton } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzePangramResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

const PRESETS = [
  { label: 'Classic', value: 'The quick brown fox jumps over the lazy dog' },
  { label: 'Perfect', value: 'Mr Jock, TV quiz PhD, bags few lynx' },
  { label: 'Isogram', value: 'Dermatoglyphics' },
  { label: 'Not quite', value: 'Pack my box with five dozen liquor' },
  {
    label: 'Mixed text',
    value:
      'Hello world. The quick brown fox jumps over the lazy dog. Sphinx of black quartz, judge my vow. Just a plain sentence.',
  },
];

/**
 * Usage heat for a present letter. Missing letters are handled separately —
 * they are the point of the tool, so they get their own treatment rather than
 * being the cold end of a scale.
 */
function heatClass(count: number, max: number): string {
  const ratio = max === 0 ? 0 : count / max;
  if (ratio > 0.66) return 'bg-rose-200 border-rose-400 text-rose-900';
  if (ratio > 0.33) return 'bg-amber-100 border-amber-300 text-amber-900';
  return 'bg-emerald-50 border-emerald-300 text-emerald-800';
}

export function PangramChecker() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const hasInput = input.trim().length > 0;

  const result = useMemo(
    () => analyzePangramResult(hasInput ? input : ''),
    [input, hasInput]
  );

  const maxFreq = result.mostCommon?.count ?? 0;

  const verdictTone: BadgeTone = !hasInput
    ? 'neutral'
    : result.isPangram
      ? 'pass'
      : result.missing.length <= 3
        ? 'warn'
        : 'fail';

  const verdictLabel = !hasInput
    ? 'awaiting text'
    : result.isPerfectPangram
      ? 'perfect pangram'
      : result.isPangram
        ? 'pangram'
        : 'not a pangram';

  // Sentence-level breakdown only earns its space once there is more than one.
  const showSentences = result.sentences.length > 1;

  return (
    <Panel
      title="Pangram Checker"
      description="A pangram uses every letter of the alphabet at least once, like [1 The quick brown fox jumps over the lazy dog 2]. Type below and the A–Z grid fills in live — missing letters stay outlined, used ones are shaded by how often they appear."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <SectionTitle
              note={
                // The counts and the file control share this row, so the
                // control keeps the place it has on every other tool.
                <span className="flex items-center gap-2">
                  {hasInput &&
                    `${result.charCount} char${result.charCount === 1 ? '' : 's'} · ${result.wordCount} word${result.wordCount === 1 ? '' : 's'}`}
                  <LoadFileButton onText={setInput} title="Load the text from a file" />
                </span>
              }
            >
              Input text
            </SectionTitle>
            <FileDropZone onText={setInput}>
              <textarea
                className="block bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-28 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
                spellCheck={false}
                placeholder="The quick brown fox jumps over the lazy dog"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </FileDropZone>
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {/* Verdict */}
          <div
            className={`border px-4 py-4 ${
              verdictTone === 'pass'
                ? 'bg-emerald-50 border-emerald-200'
                : verdictTone === 'warn'
                  ? 'bg-amber-50 border-amber-200'
                  : verdictTone === 'fail'
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge tone={verdictTone}>{verdictLabel}</StatusBadge>
              {hasInput && result.isIsogram && (
                <StatusBadge tone="info">isogram</StatusBadge>
              )}
            </div>
            <p className="text-sm text-gray-700">
              {!hasInput
                ? 'Enter some text to check it against all 26 letters.'
                : result.isPerfectPangram
                  ? 'Every letter of the alphabet appears exactly once — a perfect pangram.'
                  : result.isPangram
                    ? `All 26 letters are present, using ${result.letterCount} letters in total (${result.excessLetters} more than the minimum).`
                    : `${result.missing.length} letter${result.missing.length === 1 ? ' is' : 's are'} missing: ${result.missing.join(', ')}.`}
            </p>

            <div className="mt-3">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Alphabet coverage
                </span>
                <span className="font-mono text-xs text-gray-500">
                  {result.uniqueLetters}/26 · {Math.round(result.coverage * 100)}%
                </span>
              </div>
              <Meter ratio={result.coverage} tone={verdictTone} />
            </div>
          </div>

          {/* A–Z grid */}
          <div className="flex flex-col gap-3">
            <SectionTitle note="count shown under each letter">Alphabet</SectionTitle>
            {/* 13 columns lays the alphabet out as exactly two rows of 13. */}
            <div className="grid grid-cols-7 sm:grid-cols-[repeat(13,minmax(0,1fr))] gap-1 sm:gap-1.5">
              {ALPHABET.map(ch => {
                const count = result.frequency[ch];
                const used = count > 0;
                return (
                  <span
                    key={ch}
                    title={
                      used
                        ? `${ch.toUpperCase()} — ${count} occurrence${count === 1 ? '' : 's'}`
                        : `${ch.toUpperCase()} — missing`
                    }
                    className={`aspect-square flex flex-col items-center justify-center border font-mono ${
                      used
                        ? heatClass(count, maxFreq)
                        : 'bg-white border-dashed border-gray-300 text-gray-400'
                    }`}
                  >
                    <span className="uppercase text-sm sm:text-base font-bold leading-none">
                      {ch}
                    </span>
                    <span className="text-[9px] leading-none mt-1 opacity-70">
                      {used ? count : '—'}
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-white border border-dashed border-gray-300" /> missing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-50 border border-emerald-300" /> light use
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-100 border border-amber-300" /> medium
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-200 border border-rose-400" /> heavy
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <StatTile
              label="Letters used"
              value={`${result.uniqueLetters}/26`}
              hint={result.missing.length ? `${result.missing.length} missing` : 'complete'}
            />
            <StatTile
              label="Total letters"
              value={result.letterCount}
              hint={result.isPangram ? `${result.excessLetters} over minimum` : 'a–z only'}
            />
            <StatTile label="Words" value={result.wordCount} hint={`${result.charCount} characters`} />
            <StatTile
              label="Most common"
              value={
                result.mostCommon ? (
                  <span className="uppercase">{result.mostCommon.letter}</span>
                ) : (
                  '—'
                )
              }
              hint={result.mostCommon ? `${result.mostCommon.count}×` : undefined}
            />
            <StatTile
              label="Used once"
              value={result.onceOnly.length}
              // A perfect pangram puts all 26 letters here, which would swamp
              // the tile — list a few and let the grid show the rest.
              hint={
                result.onceOnly.length === 0
                  ? 'no single-use letters'
                  : result.onceOnly.length > 8
                    ? `${result.onceOnly.slice(0, 8).join(' ').toUpperCase()} …`
                    : result.onceOnly.join(' ').toUpperCase()
              }
            />
          </div>

          {/* Missing letters, called out on their own */}
          {hasInput && !result.isPangram && (
            <div className="flex flex-col gap-2">
              <SectionTitle note={`${result.missing.length} to go`}>Missing letters</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {result.missing.map(ch => (
                  <span
                    key={ch}
                    className="w-8 h-8 flex items-center justify-center border border-rose-300 bg-rose-50 text-rose-700 font-mono font-bold uppercase text-sm"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Frequency table for the letters actually used */}
          {result.present.length > 0 && (
            <div className="flex flex-col gap-2">
              <SectionTitle note={`${result.present.length} distinct, most frequent first`}>
                Letter frequency
              </SectionTitle>
              <ResultTable
                headers={['Letter', 'Count', 'Share', '']}
                align={['left', 'right', 'right', 'left']}
                rows={result.present
                  .slice()
                  .sort((a, b) => result.frequency[b] - result.frequency[a] || a.localeCompare(b))
                  .map(ch => {
                    const count = result.frequency[ch];
                    return [
                      <span key="l" className="uppercase font-bold">
                        {ch}
                      </span>,
                      count,
                      `${((count / result.letterCount) * 100).toFixed(1)}%`,
                      <div key="m" className="min-w-[6rem]">
                        <Meter ratio={maxFreq === 0 ? 0 : count / maxFreq} tone="fail" />
                      </div>,
                    ];
                  })}
              />
            </div>
          )}

          {/* Per-sentence breakdown */}
          {showSentences && (
            <div className="flex flex-col gap-2">
              <SectionTitle
                note={`${result.sentences.filter(s => s.isPangram).length} of ${result.sentences.length} are pangrams`}
              >
                By sentence
              </SectionTitle>
              <ResultTable
                headers={['#', 'Sentence', 'Coverage', 'Pangram']}
                align={['right', 'left', 'right', 'left']}
                rows={result.sentences.map((s, i) => [
                  i + 1,
                  <span key="t" className="font-sans text-gray-700 break-words">
                    {s.text}
                  </span>,
                  `${26 - s.missing.length}/26`,
                  <StatusBadge key="b" tone={s.isPangram ? 'pass' : 'neutral'}>
                    {s.isPangram ? 'yes' : 'no'}
                  </StatusBadge>,
                ])}
              />
              {result.shortestPangram && result.shortestPangram !== input.trim() && (
                <p className="text-[11px] text-gray-400">
                  Shortest pangram sentence ({result.shortestPangram.length} chars):{' '}
                  <span className="font-mono text-gray-600">{result.shortestPangram}</span>
                </p>
              )}
            </div>
          )}

        </div>
      }
    />
  );
}
