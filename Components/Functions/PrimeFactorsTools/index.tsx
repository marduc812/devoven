'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  HeroResult,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeFactorization,
  factorExpression,
  isPrimeFactorization,
  superscript,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: '360', value: '360' },
  { label: '496', value: '496' },
  { label: '1024', value: '1024' },
  { label: '9973', value: '9973' },
  { label: '123456', value: '123456' },
];

const CLASS_TONE: Record<string, BadgeTone> = {
  perfect: 'pass',
  abundant: 'info',
  deficient: 'neutral',
  none: 'neutral',
};

const CLASS_HINT: Record<string, string> = {
  perfect: 'proper divisors sum to the number itself',
  abundant: 'proper divisors sum to more than the number',
  deficient: 'proper divisors sum to less than the number',
  none: '1 has no proper divisors',
};

/** Colour per distinct prime so the same factor is recognisable across the page. */
const SWATCHES = [
  'bg-indigo-100 border-indigo-300 text-indigo-900',
  'bg-emerald-100 border-emerald-300 text-emerald-900',
  'bg-amber-100 border-amber-300 text-amber-900',
  'bg-rose-100 border-rose-300 text-rose-900',
  'bg-cyan-100 border-cyan-300 text-cyan-900',
  'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900',
];

export function PrimeFactors() {
  const [input, setInput] = useState('360');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const { result, error } = useMemo(() => {
    try {
      return { result: analyzeFactorization(input), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input]);

  const isPrime = result ? isPrimeFactorization(result.factors) : false;
  const properSum = result ? result.sumDivisors - result.number : 0;

  /** One tile per prime power, plus a flat run of every factor with repeats. */
  const expanded = useMemo(() => {
    if (!result) return [];
    return result.factors.flatMap((f, fi) =>
      Array.from({ length: f.exp }, () => ({ base: f.base, swatch: SWATCHES[fi % SWATCHES.length] }))
    );
  }, [result]);

  return (
    <Panel
      title="Prime Factorization"
      description="Break a positive integer into its [1 prime factors 2]. Shows the factor tree as coloured prime powers, every divisor, the divisor count and sum, and whether the number is [1 perfect 2], [1 abundant 2] or [1 deficient 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Integer <span className="font-normal text-gray-400 normal-case">up to 15 digits</span>
            </label>
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="360"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              <HeroResult
                label="Prime factorization"
                tone={isPrime ? 'info' : 'neutral'}
                copyText={
                  result.factors.length === 0
                    ? '1'
                    : `${result.number} = ${factorExpression(result.factors)}`
                }
                value={
                  result.factors.length === 0 ? (
                    '1'
                  ) : (
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-gray-400">{result.number} =</span>
                      {result.factors.map((f, i) => (
                        <React.Fragment key={f.base}>
                          {i > 0 && <span className="text-gray-300 text-xl">×</span>}
                          <span>
                            {f.base}
                            {f.exp > 1 && <span className="text-xl">{superscript(f.exp)}</span>}
                          </span>
                        </React.Fragment>
                      ))}
                    </span>
                  )
                }
                note={
                  isPrime
                    ? `${result.number} is prime — it has no factors other than 1 and itself`
                    : result.factors.length === 0
                      ? '1 is a unit: neither prime nor composite'
                      : `${expanded.length} prime factors counted with multiplicity, ${result.factors.length} distinct`
                }
              />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile label="Divisors" value={result.numDivisors} hint="including 1 and n" />
                <StatTile label="Sum of divisors σ(n)" value={result.sumDivisors} />
                <StatTile label="Proper divisor sum" value={properSum} hint="excluding n itself" />
                <StatTile
                  label="Classification"
                  value={
                    result.classification === 'none' ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <StatusBadge tone={CLASS_TONE[result.classification]}>
                        {result.classification}
                      </StatusBadge>
                    )
                  }
                  hint={CLASS_HINT[result.classification]}
                />
              </div>

              {/* Prime powers */}
              {result.factors.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="each prime power and the value it contributes">
                    Prime powers
                  </SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {result.factors.map((f, i) => (
                      <div
                        key={f.base}
                        className={`border px-3 py-2 ${SWATCHES[i % SWATCHES.length]}`}
                      >
                        <div className="font-mono text-lg font-bold">
                          {f.base}
                          {f.exp > 1 && superscript(f.exp)}
                        </div>
                        <div className="font-mono text-[11px] opacity-70">
                          = {Math.pow(f.base, f.exp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Flat expansion — useful when exponents hide how many factors there really are */}
                  {expanded.length > result.factors.length && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">
                        Expanded
                      </span>
                      {expanded.map((f, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className="text-gray-300 text-xs">×</span>}
                          <span
                            className={`border px-2 py-0.5 font-mono text-xs font-bold ${f.swatch}`}
                          >
                            {f.base}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Divisors */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={`${result.numDivisors} total · primes highlighted`}
                >
                  Divisors
                </SectionTitle>
                <div className="border border-gray-200 px-3 py-3 max-h-64 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {result.divisors.map(d => {
                      const isPrimeDivisor = result.factors.some(f => f.base === d);
                      const isSelf = d === result.number;
                      return (
                        <span
                          key={d}
                          title={
                            isSelf
                              ? 'the number itself'
                              : isPrimeDivisor
                                ? 'prime divisor'
                                : undefined
                          }
                          className={`border px-2 py-0.5 font-mono text-xs ${
                            isPrimeDivisor
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                              : isSelf
                                ? 'bg-gray-100 border-gray-300 text-gray-500'
                                : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          {d.toLocaleString()}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
