'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  Meter,
  PresetRow,
  SectionTitle,
  StatTile,
} from '@/Components/MainView/MainPanel/ResultUI';
import { TOKEN_MODES, tokenizeResult, type TokenMode } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const SAMPLE = `The quick brown fox jumps over the lazy dog. The dog barks!

Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump?
A second line in the same paragraph.`;

const PRESETS = [{ label: 'Sample text', value: SAMPLE }];

const MODE_LABEL: Record<TokenMode, string> = {
  words: 'Words',
  sentences: 'Sentences',
  paragraphs: 'Paragraphs',
  lines: 'Lines',
};

/** Long tokens (sentences, paragraphs) get their own row; words tile compactly. */
const isCompact = (mode: TokenMode) => mode === 'words';

/** Rendering every token of a large document would stall the page. */
const DISPLAY_LIMIT = 500;

export const TextTokenizer = () => {
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<TokenMode>('words');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m && (TOKEN_MODES as string[]).includes(m)) setMode(m as TokenMode);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input, mode })

  const result = useMemo(
    () => (input.trim() ? tokenizeResult(input, mode) : null),
    [input, mode]
  );

  /** Counts for every mode at once, so the mode buttons show what you'd get. */
  const modeCounts = useMemo(() => {
    if (!input.trim()) return null;
    return Object.fromEntries(
      TOKEN_MODES.map(m => [m, tokenizeResult(input, m).count])
    ) as Record<TokenMode, number>;
  }, [input]);

  const visible = result
    ? showAll
      ? result.tokens
      : result.tokens.slice(0, DISPLAY_LIMIT)
    : [];

  const topFrequency = result?.frequency.filter(f => f.count > 1).slice(0, 20) ?? [];
  const maxFreq = topFrequency[0]?.count ?? 1;

  return (
    <Panel
      title="Text Tokenizer"
      description="Split text into [1 words 2], [1 sentences 2], [1 paragraphs 2] or [1 lines 2]. Every token is listed and numbered, with length statistics and a frequency breakdown of anything that repeats."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Input text
            </label>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-40 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
              placeholder="Paste text to tokenize"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} label="Load" />
          </div>

          {/* Mode */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Split by
            </span>
            {TOKEN_MODES.map(m => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setShowAll(false);
                }}
                className={`px-3 py-2 text-xs font-bold transition-colors duration-150 cursor-pointer border ${
                  mode === m
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {MODE_LABEL[m]}
                {modeCounts && (
                  <span
                    className={`ml-1.5 font-mono font-normal ${
                      mode === m ? 'text-gray-300' : 'text-gray-400'
                    }`}
                  >
                    {modeCounts[m]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {result && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label={MODE_LABEL[result.mode]}
                  value={result.count.toLocaleString()}
                  hint="tokens found"
                />
                <StatTile
                  label="Unique"
                  value={result.uniqueCount.toLocaleString()}
                  hint={
                    result.count > 0
                      ? `${Math.round((result.uniqueCount / result.count) * 100)}% distinct`
                      : undefined
                  }
                />
                <StatTile
                  label="Avg length"
                  value={result.averageLength.toFixed(1)}
                  hint="characters per token"
                />
                <StatTile
                  label="Total chars"
                  value={result.totalChars.toLocaleString()}
                  hint="excluding separators"
                />
              </div>

              {(result.shortest !== null || result.longest !== null) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <StatTile
                    label="Shortest"
                    value={
                      <span className="line-clamp-2">
                        {result.shortest || <span className="text-gray-400 italic">empty</span>}
                      </span>
                    }
                    hint={`${result.shortest?.length ?? 0} chars`}
                  />
                  <StatTile
                    label="Longest"
                    value={<span className="line-clamp-2">{result.longest}</span>}
                    hint={`${result.longest?.length ?? 0} chars`}
                  />
                </div>
              )}

              {/* Tokens */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={
                    <span className="flex items-center gap-3">
                      {!showAll && result.count > DISPLAY_LIMIT && (
                        <span>
                          showing {DISPLAY_LIMIT} of {result.count.toLocaleString()}
                        </span>
                      )}
                      <CopyButton text={result.tokens.join('\n')} label="all tokens" />
                    </span>
                  }
                >
                  Tokens
                </SectionTitle>

                <div className="border border-gray-200 max-h-96 overflow-y-auto">
                  {isCompact(result.mode) ? (
                    <div className="flex flex-wrap gap-1 p-3">
                      {visible.map((t, i) => (
                        <span
                          key={i}
                          title={`Token ${i + 1}`}
                          className="inline-flex items-baseline gap-1 border border-gray-200 bg-white px-2 py-0.5"
                        >
                          <span className="font-mono text-[9px] text-gray-400">{i + 1}</span>
                          <span className="font-mono text-xs text-gray-900">{t}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {visible.map((t, i) => (
                        <div key={i} className="flex gap-3 px-3 py-2">
                          <span className="font-mono text-[10px] text-gray-400 w-8 flex-shrink-0 pt-0.5 text-right">
                            {i + 1}
                          </span>
                          <span className="font-mono text-xs text-gray-900 whitespace-pre-wrap break-words min-w-0">
                            {t || <span className="text-gray-400 italic">(empty)</span>}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400 ml-auto flex-shrink-0 pt-0.5">
                            {t.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {result.count > DISPLAY_LIMIT && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="self-start px-3 py-2 text-xs font-bold border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                  >
                    {showAll
                      ? `Show first ${DISPLAY_LIMIT}`
                      : `Show all ${result.count.toLocaleString()}`}
                  </button>
                )}
              </div>

              {/* Frequency */}
              {topFrequency.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="case-insensitive · only tokens appearing more than once">
                    Most frequent
                  </SectionTitle>
                  <div className="border border-gray-200 divide-y divide-gray-200">
                    {topFrequency.map(f => (
                      <div key={f.token} className="flex items-center gap-3 px-3 py-2">
                        <span className="font-mono text-xs text-gray-900 w-40 flex-shrink-0 truncate">
                          {f.token}
                        </span>
                        <span className="flex-1 min-w-0">
                          <Meter ratio={f.count / maxFreq} />
                        </span>
                        <span className="font-mono text-xs font-bold text-gray-900 w-8 text-right flex-shrink-0">
                          {f.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
