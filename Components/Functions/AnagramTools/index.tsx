'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  Field,
  HeroResult,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import { compareAnagram } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'listen / silent', value: ['listen', 'silent'] },
  { label: 'Dormitory / Dirty Room', value: ['Dormitory', 'Dirty Room'] },
  { label: 'Astronomer / Moon starer', value: ['Astronomer', 'Moon starer'] },
  { label: 'hello / world', value: ['hello', 'world'] },
];

export function AnagramChecker() {
  const [a, setA] = useState('listen');
  const [b, setB] = useState('silent');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (!from) return;
    // `?from=` may carry both sides on separate lines, as the old textarea did.
    const [first, second] = from.split('\n');
    if (first !== undefined) setA(first.trim());
    if (second !== undefined) setB(second.trim());
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: [a, b].join('\n') })

  const result = useMemo(() => (a.trim() || b.trim() ? compareAnagram(a, b) : null), [a, b]);

  const pick = ([first, second]: string[]) => {
    setA(first);
    setB(second);
  };

  const swap = () => {
    setA(b);
    setB(a);
  };

  return (
    <Panel
      title="Anagram Checker"
      description="Check whether two words or phrases are [1 anagrams 2] — the same letters rearranged. Case, spaces and punctuation are ignored. The letter balance below shows exactly which letters differ and by how many."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Field label="String A" value={a} onChange={setA} placeholder="listen" />
              <button
                onClick={swap}
                aria-label="Swap the two strings"
                title="Swap"
                className="px-3 py-3 text-sm border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer flex-shrink-0"
              >
                ⇄
              </button>
              <Field label="String B" value={b} onChange={setB} placeholder="silent" />
            </div>
            <PresetRow presets={PRESETS} onPick={pick} />
          </div>

          {result && (
            <>
              <HeroResult
                label="Anagram"
                tone={result.isAnagram ? 'pass' : 'fail'}
                value={result.isAnagram ? 'Yes' : 'No'}
                note={
                  result.isAnagram
                    ? `Both reduce to "${result.normalizedA}"`
                    : result.lettersA !== result.lettersB
                      ? `Different letter counts — ${result.lettersA} vs ${result.lettersB}`
                      : `${result.mismatchCount} letter${
                          result.mismatchCount === 1 ? '' : 's'
                        } out of place`
                }
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile label="Letters in A" value={result.lettersA} hint="ignoring non-letters" />
                <StatTile label="Letters in B" value={result.lettersB} hint="ignoring non-letters" />
                <StatTile
                  label="Distinct letters"
                  value={result.letters.length}
                  hint="across both strings"
                />
                <StatTile
                  label="Mismatches"
                  value={result.mismatchCount}
                  hint={result.mismatchCount === 0 ? 'perfectly balanced' : 'total surplus letters'}
                />
              </div>

              {/* Normalized fingerprints */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="lowercased, non-letters stripped, sorted">
                  Sorted fingerprint
                </SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      ['A', result.normalizedA, result.a],
                      ['B', result.normalizedB, result.b],
                    ] as const
                  ).map(([side, norm, raw]) => (
                    <div
                      key={side}
                      className={`border px-3 py-2 min-w-0 ${
                        result.isAnagram
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 truncate">
                        {side} — {raw || <span className="italic text-gray-400">empty</span>}
                      </div>
                      <div className="font-mono text-sm text-gray-900 break-all tracking-wider">
                        {norm || <span className="text-gray-400">no letters</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Letter balance */}
              {result.letters.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="green matches · amber surplus in A · rose surplus in B">
                    Letter balance
                  </SectionTitle>
                  <div className="border border-gray-200 overflow-x-auto">
                    <div className="flex flex-wrap gap-1 p-3 min-w-fit">
                      {result.letters.map(l => {
                        const matched = l.diff === 0;
                        return (
                          <div
                            key={l.letter}
                            title={`"${l.letter}" — A: ${l.countA}, B: ${l.countB}`}
                            className={`flex flex-col items-center border w-12 ${
                              matched
                                ? 'bg-emerald-50 border-emerald-200'
                                : l.diff > 0
                                  ? 'bg-amber-50 border-amber-300'
                                  : 'bg-rose-50 border-rose-300'
                            }`}
                          >
                            <span
                              className={`font-mono text-base font-bold py-0.5 ${
                                matched ? 'text-emerald-800' : 'text-gray-900'
                              }`}
                            >
                              {l.letter}
                            </span>
                            <span className="font-mono text-[10px] text-gray-600 border-t border-inherit w-full text-center py-0.5">
                              {l.countA} : {l.countB}
                            </span>
                            {!matched && (
                              <span
                                className={`font-mono text-[10px] font-bold w-full text-center py-0.5 ${
                                  l.diff > 0 ? 'text-amber-700' : 'text-rose-700'
                                }`}
                              >
                                {l.diff > 0 ? `+${l.diff}` : l.diff}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Each tile reads <span className="font-mono">count in A : count in B</span>.
                  </p>
                </div>
              )}

            </>
          )}
        </div>
      }
    />
  );
}
