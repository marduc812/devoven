'use client';
import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  HeroResult,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeGcdLcm,
  formatFactorization,
  type GcdLcmReport,
} from './logic';

const PRESETS = [
  { label: '12, 8', value: '12 8' },
  { label: '48, 180', value: '48 180' },
  { label: '4, 6, 10', value: '4 6 10' },
  { label: '17, 23', value: '17 23' },
  { label: '1071, 462', value: '1071 462' },
];

/**
 * Both answers are read off one table — the GCD takes the smallest exponent of each
 * prime and the LCM the largest — which is the part the old text dump never showed.
 */
const FactorGrid = ({ report }: { report: GcdLcmReport }) => {
  const { primes, exponentGrid, gcdExponents, lcmExponents, numbers } = report;

  const cell = (exp: number, emphasis?: 'min' | 'max') => {
    if (exp === 0) return <span className="text-gray-400">·</span>;
    const className =
      emphasis === 'min'
        ? 'text-emerald-700 font-bold'
        : emphasis === 'max'
          ? 'text-indigo-700 font-bold'
          : 'text-gray-900';
    return <span className={className}>{exp}</span>;
  };

  return (
    <ResultTable
      headers={['', ...primes.map(p => String(p)), 'Factorisation']}
      align={['left', ...primes.map(() => 'right' as const), 'left']}
      rows={[
        ...numbers.map((n, r) => [
          <span key="n" className="font-bold">{n}</span>,
          ...exponentGrid[r].map((e, c) => <span key={c}>{cell(e)}</span>),
          <span key="f" className="text-gray-500">
            {formatFactorization(report.factorizations[r].factors)}
          </span>,
        ]),
        [
          <span key="g" className="text-emerald-700 font-bold uppercase text-[10px] tracking-widest">
            GCD — min
          </span>,
          ...gcdExponents.map((e, c) => <span key={c}>{cell(e, 'min')}</span>),
          <span key="gf" className="text-emerald-700 font-bold">{report.gcd}</span>,
        ],
        [
          <span key="l" className="text-indigo-700 font-bold uppercase text-[10px] tracking-widest">
            LCM — max
          </span>,
          ...lcmExponents.map((e, c) => <span key={c}>{cell(e, 'max')}</span>),
          <span key="lf" className="text-indigo-700 font-bold">{report.lcm.toLocaleString('en-US')}</span>,
        ],
      ]}
    />
  );
};

export function GcdLcmCalculator() {
  const [input, setInput] = useState('48 180');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const { report, error } = useMemo(() => {
    if (!input.trim()) return { report: null, error: '' };
    try {
      return { report: analyzeGcdLcm(input), error: '' };
    } catch (e) {
      return { report: null, error: (e as Error).message };
    }
  }, [input]);

  return (
    <Panel
      title="GCD & LCM Calculator"
      description="Greatest common divisor and least common multiple of two or more numbers, entered [1 space or comma separated 2]. Both answers are shown against the prime factorisation they come from, with the Euclidean division steps for a pair."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
              htmlFor="gcd-input"
            >
              Numbers
            </label>
            <input
              id="gcd-input"
              className={inputClass}
              placeholder="48 180"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {report && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <HeroResult
                  label="GCD — greatest common divisor"
                  value={report.gcd}
                  tone="pass"
                  copyText={String(report.gcd)}
                  note={`Largest number dividing all ${report.numbers.length} inputs`}
                />
                <HeroResult
                  label="LCM — least common multiple"
                  value={report.lcm.toLocaleString('en-US')}
                  tone="info"
                  copyText={String(report.lcm)}
                  note={
                    report.lcmExact
                      ? `Smallest number all ${report.numbers.length} inputs divide into`
                      : 'Past 2^53 — this value is rounded, not exact'
                  }
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {report.coprime && (
                  <StatusBadge tone="pass">Coprime — no shared prime factor</StatusBadge>
                )}
                {!report.lcmExact && (
                  <StatusBadge tone="warn">LCM exceeds the exact integer range</StatusBadge>
                )}
                {report.factorizations.every(f => f.isPrime) && (
                  <StatusBadge tone="info">Every input is prime</StatusBadge>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile label="Numbers" value={report.numbers.length} />
                <StatTile
                  label="Shared primes"
                  value={report.gcdExponents.filter(e => e > 0).length}
                  hint="Present in every input"
                />
                <StatTile
                  label="Common divisors"
                  value={report.commonDivisors.length}
                  hint="Divisors of the GCD"
                />
                {report.reduced ? (
                  <StatTile
                    label="Reduced ratio"
                    value={`${report.reduced[0]} : ${report.reduced[1]}`}
                    hint="Each input over the GCD"
                  />
                ) : (
                  <StatTile
                    label="Distinct primes"
                    value={report.primes.length}
                    hint="Across all inputs"
                  />
                )}
              </div>

              {report.primes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="Exponent of each prime, per input">
                    Prime factorisation
                  </SectionTitle>
                  <FactorGrid report={report} />
                  <p className="text-[11px] text-gray-500">
                    Take the smallest exponent in each column and you have the GCD; take the largest
                    and you have the LCM. A column holding a dot contributes nothing to the GCD,
                    because that prime is missing from at least one input.
                  </p>
                </div>
              )}

              {report.steps.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle
                    note={`${report.steps.length} division${report.steps.length > 1 ? 's' : ''} to reach remainder 0`}
                  >
                    Euclidean algorithm
                  </SectionTitle>
                  <ResultTable
                    headers={['Step', 'a', 'b', 'a ÷ b', 'a mod b']}
                    align={['right', 'right', 'right', 'right', 'right']}
                    rows={report.steps.map((s, i) => [
                      i + 1,
                      s.a,
                      s.b,
                      s.quotient,
                      s.remainder === 0 ? (
                        <span className="text-emerald-700 font-bold">0</span>
                      ) : (
                        s.remainder
                      ),
                    ])}
                  />
                  <p className="text-[11px] text-gray-500">
                    Each step replaces (a, b) with (b, a mod b). The divisor of the row that finally
                    hits remainder 0 —{' '}
                    <span className="font-mono font-bold text-gray-700">{report.gcd}</span> — is the
                    GCD.
                  </p>
                </div>
              )}

              {report.numbers.length === 2 && (
                <div className="border border-gray-200 bg-gray-50 px-3 py-2 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Check
                  </div>
                  <div className="font-mono text-xs text-gray-700">
                    {report.numbers[0]} × {report.numbers[1]} ={' '}
                    <span className="text-gray-900 font-bold">
                      {(report.numbers[0] * report.numbers[1]).toLocaleString('en-US')}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-gray-700">
                    GCD × LCM = {report.gcd} × {report.lcm.toLocaleString('en-US')} ={' '}
                    <span className="text-gray-900 font-bold">
                      {(report.gcd * report.lcm).toLocaleString('en-US')}
                    </span>
                    <span className="text-gray-400"> — the two always agree for a pair</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionTitle note="Every number that divides all the inputs">
                  Common divisors
                </SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {report.commonDivisors.map(d => (
                    <span
                      key={d}
                      className={`font-mono text-xs border px-2 py-1 ${
                        d === report.gcd
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
