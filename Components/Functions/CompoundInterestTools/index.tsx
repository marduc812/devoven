'use client';
import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calculateCompoundInterest } from './logic';
import type { CompoundFrequency } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const FREQUENCIES: { value: CompoundFrequency; label: string }[] = [
  { value: 'annual', label: 'Annual (1×/yr)' },
  { value: 'semi-annual', label: 'Semi-Annual (2×/yr)' },
  { value: 'quarterly', label: 'Quarterly (4×/yr)' },
  { value: 'monthly', label: 'Monthly (12×/yr)' },
  { value: 'daily', label: 'Daily (365×/yr)' },
];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CompoundInterestCalculator() {
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('7');
  const [frequency, setFrequency] = useState<CompoundFrequency>('monthly');
  const [years, setYears] = useState('10');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setPrincipal(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: principal })

  const result = useMemo(() => {
    try {
      const p = parseFloat(principal);
      const r = parseFloat(rate);
      const y = parseInt(years, 10);
      if (isNaN(p) || isNaN(r) || isNaN(y)) return null;
      return { data: calculateCompoundInterest({ principal: p, annualRate: r, frequency, years: y }), error: null };
    } catch (e) {
      return { data: null, error: (e as Error).message };
    }
  }, [principal, rate, frequency, years]);

  const data = result?.data ?? null;
  const error = result?.error ?? null;

  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1';
  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none text-sm font-mono';

  const maxBalance = data ? Math.max(...data.yearByYear.map(r => r.balance)) : 1;

  return (
    <Panel
      title="Compound Interest Calculator"
      description="Calculate compound interest with year-by-year growth. Enter a [1 principal 2], [1 annual rate 2], [1 compounding frequency 2], and [1 number of years 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Principal ($)</label>
              <input className={inputClass} placeholder="10000" value={principal} onChange={e => setPrincipal(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Annual Rate (%)</label>
              <input className={inputClass} placeholder="7" value={rate} onChange={e => setRate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Compounding</label>
              <select
                className="bg-white text-gray-900 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 w-full"
                value={frequency}
                onChange={e => setFrequency(e.target.value as CompoundFrequency)}
              >
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Years</label>
              <input className={inputClass} placeholder="10" value={years} onChange={e => setYears(e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{error}</div>
          )}

          {data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Final Amount</p>
                  <p className="text-xl font-black text-gray-900 font-mono">${fmt(data.finalAmount)}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Interest</p>
                  <p className="text-xl font-black text-gray-900 font-mono">${fmt(data.totalInterest)}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Effective Rate</p>
                  <p className="text-xl font-black text-gray-900 font-mono">{data.effectiveAnnualRate.toFixed(3)}%</p>
                </div>
              </div>

              {/* Year-by-year table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Year-by-Year Growth {data.yearByYear.length < parseInt(years, 10) ? `(first ${data.yearByYear.length} years shown)` : ''}
                </p>
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-12">Yr</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Balance</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Interest (yr)</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 hidden sm:table-cell">Total Interest</th>
                        <th className="px-3 py-2 w-24 hidden md:table-cell"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.yearByYear.map((row, i) => (
                        <tr key={row.year} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <td className="px-3 py-2 text-gray-400 font-mono text-xs">{row.year}</td>
                          <td className="px-3 py-2 text-gray-900 font-mono font-bold">${fmt(row.balance)}</td>
                          <td className="px-3 py-2 text-gray-600 font-mono text-xs hidden sm:table-cell">+${fmt(row.interestEarned)}</td>
                          <td className="px-3 py-2 text-gray-500 font-mono text-xs hidden sm:table-cell">${fmt(row.totalInterest)}</td>
                          <td className="px-3 py-2 hidden md:table-cell">
                            <div className="h-2 bg-gray-100 w-full">
                              <div
                                className="h-2 bg-gray-900"
                                style={{ width: `${(row.balance / maxBalance) * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
