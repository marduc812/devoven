'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  Field,
  HeroResult,
  Meter,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  ValueCard,
} from '@/Components/MainView/MainPanel/ResultUI';
import { compareHamming } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'karolin / kathrin', value: ['karolin', 'kathrin'] },
  { label: 'binary', value: ['1011101', '1001001'] },
  { label: '2173896 / 2233796', value: ['2173896', '2233796'] },
  { label: 'identical', value: ['sequence', 'sequence'] },
];

/** Characters are laid out in rows so long strings stay aligned and readable. */
const CHUNK = 32;

export function HammingDistance() {
  const [a, setA] = useState('karolin');
  const [b, setB] = useState('kathrin');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (!from) return;
    // `?from=` may carry both strings on separate lines, as the old textarea did.
    const [first, second] = from.split('\n');
    if (first !== undefined) setA(first.trim());
    if (second !== undefined) setB(second.trim());
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: [a, b].join('\n') })

  const result = useMemo(() => (a || b ? compareHamming(a, b) : null), [a, b]);

  const chunks = useMemo(() => {
    if (!result?.equalLength) return [];
    const out: (typeof result.positions)[] = [];
    for (let i = 0; i < result.positions.length; i += CHUNK) {
      out.push(result.positions.slice(i, i + CHUNK));
    }
    return out;
  }, [result]);

  const pick = ([first, second]: string[]) => {
    setA(first);
    setB(second);
  };

  const similarityPct = result ? result.similarity * 100 : 0;

  return (
    <Panel
      title="Hamming Distance"
      description="Count the positions at which two equal-length strings differ. Works on text or [1 binary 2] — enter [1 1011101 2] and [1 1001001 2] to also get the XOR. Differing positions are highlighted character by character."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Field
                label="String A"
                hint={`${a.length} chars`}
                value={a}
                onChange={setA}
                placeholder="karolin"
              />
              <Field
                label="String B"
                hint={`${b.length} chars`}
                value={b}
                onChange={setB}
                placeholder="kathrin"
              />
            </div>
            <PresetRow presets={PRESETS} onPick={pick} />
          </div>

          {result && !result.equalLength && (
            <ErrorNote>
              Hamming distance requires equal-length strings — A is {result.lengthA}, B is{' '}
              {result.lengthB} ({Math.abs(result.lengthA - result.lengthB)} apart). Use Levenshtein
              distance for strings of different lengths.
            </ErrorNote>
          )}

          {result?.equalLength && (
            <>
              <HeroResult
                label="Hamming distance"
                tone={result.distance === 0 ? 'pass' : 'neutral'}
                value={result.distance}
                copyText={String(result.distance)}
                note={
                  result.distance === 0
                    ? 'the strings are identical'
                    : `${result.distance} of ${result.lengthA} positions differ`
                }
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile label="Length" value={result.lengthA} hint="both strings" />
                <StatTile
                  label="Matching"
                  value={result.lengthA - result.distance}
                  hint={`of ${result.lengthA} positions`}
                />
                <StatTile label="Differing" value={result.distance} />
                <StatTile
                  label="Type"
                  value={
                    <StatusBadge tone={result.isBinary ? 'info' : 'neutral'}>
                      {result.isBinary ? 'binary' : 'text'}
                    </StatusBadge>
                  }
                />
              </div>

              {/* Similarity */}
              <div className="flex flex-col gap-2">
                <SectionTitle note={`${similarityPct.toFixed(1)}%`}>Similarity</SectionTitle>
                <Meter
                  ratio={result.similarity}
                  tone={
                    result.similarity === 1 ? 'pass' : result.similarity >= 0.5 ? 'info' : 'warn'
                  }
                />
              </div>

              {/* Character alignment */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="rose columns are the differing positions">
                  Character alignment
                </SectionTitle>
                <div className="border border-gray-200 overflow-x-auto">
                  <div className="min-w-fit p-3 flex flex-col gap-4">
                    {chunks.map((chunk, ci) => (
                      <div key={ci} className="flex flex-col gap-px">
                        {/* Index ruler — every 5th position, plus the first of the row */}
                        <div className="flex gap-px">
                          {chunk.map((p, i) => (
                            <span
                              key={p.index}
                              className="w-6 text-center font-mono text-[9px] text-gray-400"
                            >
                              {p.index % 5 === 0 || i === 0 ? p.index : ''}
                            </span>
                          ))}
                        </div>

                        {(['charA', 'charB'] as const).map(key => (
                          <div key={key} className="flex gap-px">
                            {chunk.map(p => (
                              <span
                                key={p.index}
                                title={`Position ${p.index}: "${p.charA}" vs "${p.charB}"`}
                                className={`w-6 h-7 flex items-center justify-center border font-mono text-xs ${
                                  p.same
                                    ? 'bg-white border-gray-200 text-gray-500'
                                    : 'bg-rose-100 border-rose-300 text-rose-900 font-bold'
                                }`}
                              >
                                {p[key] === ' ' ? '␣' : p[key]}
                              </span>
                            ))}
                          </div>
                        ))}

                        {/* Match marker */}
                        <div className="flex gap-px">
                          {chunk.map(p => (
                            <span
                              key={p.index}
                              className={`w-6 text-center font-mono text-[11px] ${
                                p.same ? 'text-gray-400' : 'text-rose-600 font-bold'
                              }`}
                            >
                              {p.same ? '·' : '↕'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Differing positions */}
              {result.differingIndexes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="0-based">Differing positions</SectionTitle>
                  <div className="flex flex-wrap gap-1">
                    {result.differingIndexes.map(i => (
                      <span
                        key={i}
                        title={`"${result.a[i]}" vs "${result.b[i]}"`}
                        className="border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-xs text-rose-900"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Binary XOR */}
              {result.xor && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="1 marks each differing bit — its popcount is the distance">
                    Binary XOR
                  </SectionTitle>
                  <ValueCard label="A ⊕ B" value={result.xor} />
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
