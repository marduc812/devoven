'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  HeroResult,
  Meter,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzePrimeResult, type FactorPower } from './logic';

const PRESETS = [
  { label: '97', value: '97' },
  { label: '360', value: '360' },
  { label: '561', value: '561' },
  { label: '1024', value: '1024' },
  { label: '7919', value: '7919' },
  { label: '104729', value: '104729' },
];

/** 12 → 2² × 3, with each prime as its own chip so the structure is visible. */
const FactorChips = ({ factorization }: { factorization: FactorPower[] }) => (
  <div className="flex flex-wrap items-center gap-2">
    {factorization.map(({ base, exponent }, i) => (
      <React.Fragment key={base}>
        {i > 0 && <span className="text-gray-400 font-mono text-sm">×</span>}
        <span className="border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-sm text-gray-900">
          {base}
          {exponent > 1 && <sup className="text-[10px] text-gray-500">{exponent}</sup>}
        </span>
      </React.Fragment>
    ))}
  </div>
);

export function PrimeChecker() {
  const [input, setInput] = useState('97');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' };
    try {
      return { result: analyzePrimeResult(input), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input]);

  const step = (delta: number) => {
    if (!result) return;
    setInput(String(Math.max(0, result.n + delta)));
  };

  return (
    <Panel
      title="Prime Number Checker"
      description="Check whether a number is prime and see how it is built. Shows the [1 prime factorisation 2], every divisor, the neighbouring primes, and π(n) — the count of primes up to your number."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <input
                className={inputClass}
                placeholder="Enter a whole number, e.g. 97"
                inputMode="numeric"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous number"
                  className="px-3 py-2 text-sm font-bold border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  −
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next number"
                  className="px-3 py-2 text-sm font-bold border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              <HeroResult
                label="Verdict"
                tone={result.isPrime ? 'pass' : 'neutral'}
                copyText={String(result.n)}
                value={
                  <span className="flex flex-wrap items-center gap-3">
                    {result.n.toLocaleString()}
                    <StatusBadge tone={result.isPrime ? 'pass' : 'fail'}>
                      {result.isPrime ? 'Prime' : result.n < 2 ? 'Not prime' : 'Composite'}
                    </StatusBadge>
                  </span>
                }
                note={
                  result.isPrime
                    ? result.twinPrime
                      ? `Twin prime with ${result.twinPrime.toLocaleString()}`
                      : 'Divisible only by 1 and itself'
                    : result.n < 2
                      ? 'Primes start at 2'
                      : `${result.n.toLocaleString()} = ${result.factorizationText}`
                }
              />

              {/* Factorisation */}
              {result.factorization.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle
                    note={
                      result.factorization.length === 1 && result.factorization[0].exponent === 1
                        ? 'a single prime factor — itself'
                        : `${result.factors.length} prime factor${result.factors.length === 1 ? '' : 's'} with multiplicity`
                    }
                  >
                    Prime factorisation
                  </SectionTitle>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <FactorChips factorization={result.factorization} />
                    <CopyButton text={result.factorizationText} label="factorisation" />
                  </div>
                </div>
              )}

              {/* Figures */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label="Previous prime"
                  value={result.previousPrime?.toLocaleString() ?? '—'}
                  hint={result.previousPrime ? `−${(result.n - result.previousPrime).toLocaleString()}` : 'none below'}
                />
                <StatTile
                  label="Next prime"
                  value={result.nextPrime.toLocaleString()}
                  hint={`+${(result.nextPrime - result.n).toLocaleString()}`}
                />
                <StatTile
                  label="Divisors"
                  value={result.divisors.length.toLocaleString()}
                  hint={result.divisorClass ? `sum ${result.divisorSum.toLocaleString()} — ${result.divisorClass}` : undefined}
                />
                <StatTile
                  label="π(n)"
                  value={result.primeCount !== null ? result.primeCount.toLocaleString() : '—'}
                  hint={
                    result.primeCount !== null
                      ? `primes ≤ ${result.n.toLocaleString()}`
                      : 'too large to sieve'
                  }
                />
              </div>

              {/* Divisors */}
              {result.divisors.length > 1 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note={`sum of proper divisors is ${result.divisorClass === 'perfect' ? 'exactly' : result.divisorClass === 'abundant' ? 'greater than' : 'less than'} ${result.n.toLocaleString()}`}>
                    Divisors
                  </SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {result.divisors.map(d => (
                      <button
                        key={d}
                        onClick={() => setInput(String(d))}
                        title={`Inspect ${d}`}
                        className={`font-mono text-xs px-2 py-1 border transition-colors duration-150 cursor-pointer ${
                          d === result.n
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                        }`}
                      >
                        {d.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sieve */}
              {result.primesUpTo && result.primesUpTo.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note={`${result.primesUpTo.length} of ${result.n.toLocaleString()} numbers are prime`}>
                    Primes up to {result.n.toLocaleString()}
                  </SectionTitle>
                  <Meter ratio={result.primesUpTo.length / result.n} tone="pass" />
                  <div className="flex flex-wrap gap-1">
                    {result.primesUpTo.map(p => (
                      <button
                        key={p}
                        onClick={() => setInput(String(p))}
                        title={`Inspect ${p}`}
                        className={`font-mono text-[11px] px-1.5 py-0.5 border transition-colors duration-150 cursor-pointer ${
                          p === result.n
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                            : 'border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900'
                        }`}
                      >
                        {p}
                      </button>
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
}
