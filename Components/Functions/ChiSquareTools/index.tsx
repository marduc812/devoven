'use client';

import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { computeChiSquare, ChiSquareResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';
const fmt = (n: number, d: number) => n.toFixed(d);

function parseCSV(line: string): number[] {
  return line.split(',').map(s => {
    const n = parseFloat(s.trim());
    if (isNaN(n)) throw new Error('Invalid number: "' + s.trim() + '"');
    return n;
  });
}

export function ChiSquareTest() {
  const [observed, setObserved] = useState('');
  const [expected, setExpected] = useState('');
  const [result, setResult] = useState<ChiSquareResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setObserved(from);
    const exp_ = p.get('expected');
    if (exp_) setExpected(exp_);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: observed, expected })

  useEffect(() => {
    if (!observed.trim()) { setResult(null); setError(''); return; }
    try {
      const obs = parseCSV(observed);
      const exp = expected.trim() ? parseCSV(expected) : null;
      setResult(computeChiSquare(obs, exp));
      setError('');
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    }
  }, [observed, expected]);

  const isUniform = !expected.trim();

  return (
    <Panel
      title="Chi-Square Test"
      description="Goodness-of-fit chi-square test. Enter observed frequencies as comma-separated values (e.g. [1 30, 20, 25, 25 2]). Optionally provide expected frequencies; otherwise a [1 uniform distribution 2] is assumed."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>Observed Frequencies (comma-separated)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 30, 20, 25, 25"
                value={observed}
                onChange={e => setObserved(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Expected Frequencies (optional — leave blank for uniform)</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 25, 25, 25, 25"
                value={expected}
                onChange={e => setExpected(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {result && (
            <>
              {/* Main stats */}
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">χ² Statistic</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">{fmt(result.chiSquare, 4)}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Degrees of Freedom</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">{result.df}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">p-value</p>
                  <p className={`text-2xl font-black font-mono ${result.alpha05 ? 'text-red-700' : 'text-emerald-700'}`}>
                    {fmt(result.pValue, 4)}
                  </p>
                </div>
              </div>

              {/* Significance decisions */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Significance Decisions</p>
                <div className="flex flex-col gap-1">
                  {[
                    { label: 'α = 0.05 (5% level)', reject: result.alpha05 },
                    { label: 'α = 0.01 (1% level)', reject: result.alpha01 },
                  ].map(({ label, reject }) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between px-3 py-2.5 border ${reject ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</span>
                      <span className={`text-xs font-black uppercase tracking-widest ${reject ? 'text-red-700' : 'text-emerald-700'}`}>
                        {reject ? 'REJECT H₀' : 'Fail to reject H₀'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {result.alpha05
                    ? 'Significant difference detected — observed frequencies are unlikely under H₀.'
                    : 'No significant difference — observed frequencies are consistent with expected.'}
                </p>
              </div>

              {/* Category breakdown table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Category Breakdown {isUniform && <span className="font-normal text-gray-400">(uniform expected)</span>}
                </p>
                <div className="border border-gray-200 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Category', 'Observed', 'Expected', 'Difference', '(O-E)²/E'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.observed.map((obs, i) => {
                        const exp = result.expected[i];
                        const diff = obs - exp;
                        const contrib = (diff * diff) / exp;
                        return (
                          <tr key={i} className={i > 0 ? 'border-t border-gray-200' : ''}>
                            <td className="px-3 py-1.5 text-gray-500 text-xs">{i + 1}</td>
                            <td className="px-3 py-1.5 text-gray-900 font-mono text-xs">{fmt(obs, 2)}</td>
                            <td className="px-3 py-1.5 text-gray-500 font-mono text-xs">{fmt(exp, 2)}</td>
                            <td className={`px-3 py-1.5 font-mono text-xs ${diff > 0 ? 'text-blue-700' : diff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                              {diff > 0 ? '+' : ''}{fmt(diff, 2)}
                            </td>
                            <td className="px-3 py-1.5 text-gray-900 font-mono text-xs">{fmt(contrib, 4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!observed.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Enter observed frequencies above to run the test</p>
          )}
        </div>
      }
    />
  );
}
