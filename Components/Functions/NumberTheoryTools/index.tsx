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
import { analyzeNumber, type NumberTheoryResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: '28 perfect', value: '28' },
  { label: '561 Carmichael', value: '561' },
  { label: '9973 prime', value: '9973' },
  { label: '720 abundant', value: '720' },
  { label: '27 Collatz', value: '27' },
];

const CLASS_TONE: Record<NumberTheoryResult['classification'], BadgeTone> = {
  perfect: 'pass',
  abundant: 'info',
  deficient: 'neutral',
};

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

const sup = (n: number) =>
  String(n)
    .split('')
    .map(c => SUPERSCRIPT[c] ?? c)
    .join('');

/** A yes/no property with a one-line explanation of what it means. */
const Property = ({
  label,
  yes,
  detail,
  tone = 'info',
}: {
  label: string;
  yes: boolean;
  detail: string;
  tone?: BadgeTone;
}) => (
  <div className={`border px-3 py-2 ${yes ? '' : 'border-gray-200'}`}>
    <div className="flex items-center justify-between gap-2 mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      <StatusBadge tone={yes ? tone : 'neutral'}>{yes ? 'yes' : 'no'}</StatusBadge>
    </div>
    <div className="text-[11px] text-gray-400">{detail}</div>
  </div>
);

export function NumberTheoryCalc() {
  const [input, setInput] = useState('28');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = useMemo(() => analyzeNumber(input), [input]);
  const invalid = input.trim() !== '' && result === null;

  const omega = result?.primeFactors.reduce((a, f) => a + f.exponent, 0) ?? 0;
  const properSum = result ? result.sumOfDivisors - result.n : 0;

  /** The Collatz peak sets the chart's scale; a log feel keeps 27's spike readable. */
  const collatzMax = result ? Math.max(...result.collatz) : 1;

  return (
    <Panel
      title="Number Theory Calculator"
      description="A full number-theoretic profile of any integer from [1 1 2] to [1 1,000,000 2]: primality, prime factorization, [1 Euler totient φ(n) 2], divisors, perfect / abundant / deficient class, Liouville λ, Möbius μ and the Collatz trajectory."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Number <span className="font-normal text-gray-400 normal-case">1 to 1,000,000</span>
            </label>
            <input
              className={inputClass}
              inputMode="numeric"
              placeholder="28"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {invalid && <ErrorNote>Enter a whole number between 1 and 1,000,000</ErrorNote>}

          {result && (
            <>
              <HeroResult
                label="Prime factorization"
                tone={result.isPrime ? 'info' : 'neutral'}
                copyText={
                  result.primeFactors.length === 0
                    ? '1'
                    : `${result.n} = ${result.primeFactors
                        .map(f => (f.exponent > 1 ? `${f.prime}^${f.exponent}` : `${f.prime}`))
                        .join(' * ')}`
                }
                value={
                  result.primeFactors.length === 0 ? (
                    '1'
                  ) : (
                    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-gray-400">{result.n} =</span>
                      {result.primeFactors.map((f, i) => (
                        <React.Fragment key={f.prime}>
                          {i > 0 && <span className="text-gray-400 text-xl">×</span>}
                          <span>
                            {f.prime}
                            {f.exponent > 1 && <span className="text-xl">{sup(f.exponent)}</span>}
                          </span>
                        </React.Fragment>
                      ))}
                    </span>
                  )
                }
                note={
                  result.isPrime
                    ? `${result.n} is prime`
                    : result.primeFactors.length === 0
                      ? '1 is a unit: neither prime nor composite'
                      : `Ω(n) = ${omega} with multiplicity · ω(n) = ${result.primeFactors.length} distinct`
                }
              />

              {/* Core figures */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label="Primality"
                  value={
                    <StatusBadge tone={result.isPrime ? 'info' : 'neutral'}>
                      {result.isPrime ? 'prime' : 'composite'}
                    </StatusBadge>
                  }
                />
                <StatTile
                  label="Euler totient φ(n)"
                  value={result.totient.toLocaleString()}
                  hint="coprime to n below n"
                />
                <StatTile
                  label="Divisors d(n)"
                  value={result.divisorCount}
                  hint="including 1 and n"
                />
                <StatTile
                  label="Sum of divisors σ(n)"
                  value={result.sumOfDivisors.toLocaleString()}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label="Classification"
                  value={
                    <StatusBadge tone={CLASS_TONE[result.classification]}>
                      {result.classification}
                    </StatusBadge>
                  }
                  hint={`proper divisors sum to ${properSum.toLocaleString()}`}
                />
                <StatTile
                  label="Liouville λ(n)"
                  value={result.liouville > 0 ? '+1' : '−1'}
                  hint={`(−1)^Ω(n), Ω = ${omega}`}
                />
                <StatTile
                  label="Möbius μ(n)"
                  value={result.mobius > 0 ? '+1' : result.mobius < 0 ? '−1' : '0'}
                  hint={
                    result.mobius === 0
                      ? 'has a squared prime factor'
                      : result.mobius === 1
                        ? 'even number of distinct primes'
                        : 'odd number of distinct primes'
                  }
                />
                <StatTile
                  label="Digit sum"
                  value={result.digitSum}
                  hint={`digital root ${result.digitalRoot}`}
                />
              </div>

              {/* Properties */}
              <div className="flex flex-col gap-3">
                <SectionTitle>Properties</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Property
                    label="Perfect square"
                    yes={result.isPerfectSquare}
                    detail={
                      result.isPerfectSquare
                        ? `${Math.round(Math.sqrt(result.n))}² = ${result.n}`
                        : 'no integer square root'
                    }
                  />
                  <Property
                    label="Perfect cube"
                    yes={result.isPerfectCube}
                    detail={
                      result.isPerfectCube
                        ? `${Math.round(Math.cbrt(result.n))}³ = ${result.n}`
                        : 'no integer cube root'
                    }
                  />
                  <Property
                    label="Carmichael"
                    yes={result.isCarmichael}
                    tone="warn"
                    detail={
                      result.isCarmichael
                        ? 'Fermat pseudoprime to every base'
                        : 'fails Korselt’s criterion'
                    }
                  />
                </div>
              </div>

              {/* Divisors */}
              <div className="flex flex-col gap-3">
                <SectionTitle note={`${result.divisorCount} total · primes highlighted`}>
                  Divisors
                </SectionTitle>
                <div className="border border-gray-200 px-3 py-3 max-h-56 overflow-y-auto">
                  <div className="flex flex-wrap gap-1">
                    {result.divisors.map(d => {
                      const isPrimeDivisor = result.primeFactors.some(f => f.prime === d);
                      return (
                        <span
                          key={d}
                          title={isPrimeDivisor ? 'prime divisor' : undefined}
                          className={`border px-2 py-0.5 font-mono text-xs ${
                            isPrimeDivisor
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                              : d === result.n
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

              {/* Collatz */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={`${result.collatzLength} steps to reach 1 · peak ${collatzMax.toLocaleString()}`}
                >
                  Collatz trajectory
                </SectionTitle>

                <div className="border border-gray-200 overflow-x-auto">
                  <div
                    className="flex items-end gap-px px-3 pt-3 pb-3 min-w-fit"
                    style={{ height: 140 }}
                  >
                    {result.collatz.map((v, i) => (
                      <div
                        key={i}
                        title={`Step ${i}: ${v.toLocaleString()}`}
                        className={`w-2 flex-shrink-0 ${
                          v % 2 === 0 ? 'bg-indigo-300' : 'bg-amber-400'
                        }`}
                        style={{ height: `${Math.max(1, (v / collatzMax) * 100)}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-indigo-300" /> even → n/2
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-400" /> odd → 3n+1
                  </span>
                  {result.collatzLength > result.collatz.length && (
                    <span>showing the first {result.collatz.length} of {result.collatzLength}</span>
                  )}
                </div>

                <div className="border border-gray-200 px-3 py-3 max-h-32 overflow-y-auto font-mono text-xs text-gray-700 break-words">
                  {result.collatz.join(' → ')}
                  {result.collatzLength > result.collatz.length && ' → …'}
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
