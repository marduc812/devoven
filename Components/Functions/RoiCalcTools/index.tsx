'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calculateRoi, parseRoiInput, roiProjection } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

export function RoiCalculator() {
  const [initial, setInitial] = useState('10000');
  const [final, setFinal] = useState('16500');
  const [years, setYears] = useState('5');

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) {
      // Legacy share links carry all three values as newline-separated text.
      try {
        const parsed = parseRoiInput(from);
        setInitial(String(parsed.initialInvestment));
        setFinal(String(parsed.finalValue));
        setYears(parsed.years === null ? '' : String(parsed.years));
        return;
      } catch {
        /* fall through to the individual params */
      }
    }
    if (p.get('initial')) setInitial(p.get('initial') as string);
    if (p.get('final')) setFinal(p.get('final') as string);
    if (p.get('years')) setYears(p.get('years') as string);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ initial, final, years })

  const result = useMemo(() => {
    const i = parseFloat(initial);
    const f = parseFloat(final);
    const y = years.trim() === '' ? null : parseFloat(years);

    if (isNaN(i) || isNaN(f)) return { data: null, error: 'Enter an initial investment and a final value' };
    if (i <= 0) return { data: null, error: 'Initial investment must be positive' };
    if (y !== null && (isNaN(y) || y <= 0)) return { data: null, error: 'Holding period must be a positive number of years' };

    const inputs = { initialInvestment: i, finalValue: f, years: y };
    try {
      const roi = calculateRoi(inputs);
      const annualized = roi.annualizedRoi !== null && isFinite(roi.annualizedRoi) ? roi.annualizedRoi : null;
      return {
        data: { inputs, roi, annualized, projection: annualized === null ? [] : roiProjection(inputs, annualized) },
        error: null,
      };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Could not calculate ROI' };
    }
  }, [initial, final, years]);

  const data = result.data;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  const scale = data ? Math.max(data.inputs.initialInvestment, data.inputs.finalValue, 1) : 1;
  const projectionMax = data && data.projection.length ? Math.max(...data.projection.map(r => r.value)) : 1;

  return (
    <Panel
      title="ROI Calculator"
      description="Enter what you put in, what it came out to, and how long it took. Gives profit/loss, total [1 ROI% 2], [1 annualized ROI 2] (the rate that compounds to the same result), the multiple on your money, and a year-by-year growth path."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Initial Investment</label>
              <input className={inputClass} placeholder="10000" value={initial} onChange={e => setInitial(e.target.value)} />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Final Value</label>
              <input className={inputClass} placeholder="16500" value={final} onChange={e => setFinal(e.target.value)} />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>
                Years <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <input className={inputClass} placeholder="5" value={years} onChange={e => setYears(e.target.value)} />
            </div>
          </div>

          {result.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{result.error}</div>
          )}

          {data && (
            <>
              {/* Headline */}
              <div className={`p-6 ${data.roi.isProfit ? 'bg-gray-900' : 'bg-red-600'}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {data.roi.isProfit ? 'Gain' : 'Loss'}
                </p>
                <p className="text-4xl font-black text-white leading-none">{pct(data.roi.roi)}</p>
                <p className="text-sm text-gray-300 mt-2 font-mono">
                  {money(data.roi.profit)} on {money(data.inputs.initialInvestment)}
                </p>
              </div>

              {/* Invested vs returned */}
              <div className="border border-gray-200 p-5">
                <p className={`${labelClass} mb-3`}>Invested vs Returned</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-500 uppercase tracking-wider">Invested</span>
                      <span className="font-mono text-gray-900">{money(data.inputs.initialInvestment)}</span>
                    </div>
                    <div className="h-6 bg-gray-100">
                      <div className="h-full bg-gray-400" style={{ width: `${(data.inputs.initialInvestment / scale) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-gray-500 uppercase tracking-wider">Returned</span>
                      <span className="font-mono text-gray-900">{money(data.inputs.finalValue)}</span>
                    </div>
                    <div className="h-6 bg-gray-100">
                      <div
                        className={`h-full ${data.roi.isProfit ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${(Math.max(data.inputs.finalValue, 0) / scale) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Break-even sits at {money(data.roi.breakEvenValue)} —{' '}
                  {data.roi.isProfit
                    ? `${money(data.inputs.finalValue - data.roi.breakEvenValue)} above it.`
                    : `${money(data.roi.breakEvenValue - data.inputs.finalValue)} short of it.`}
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Profit / Loss</p>
                  <p className={`text-2xl font-black ${data.roi.isProfit ? 'text-gray-900' : 'text-red-600'}`}>
                    {money(data.roi.profit)}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Total ROI</p>
                  <p className={`text-2xl font-black ${data.roi.isProfit ? 'text-gray-900' : 'text-red-600'}`}>
                    {pct(data.roi.roi)}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Annualized</p>
                  <p className={`text-2xl font-black ${data.annualized === null ? 'text-gray-400' : data.annualized >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {data.annualized === null ? '—' : pct(data.annualized)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data.inputs.years === null ? 'add a period' : `over ${data.inputs.years} year${data.inputs.years === 1 ? '' : 's'}`}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Multiple</p>
                  <p className="text-2xl font-black text-gray-900">
                    {(data.inputs.finalValue / data.inputs.initialInvestment).toFixed(2)}×
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">on money in</p>
                </div>
              </div>

              {/* Growth path */}
              {data.projection.length > 1 && (
                <div>
                  <p className={`${labelClass} mb-2`}>
                    Growth Path{' '}
                    <span className="normal-case font-normal text-gray-400">
                      (compounding at {pct(data.annualized as number)} a year)
                    </span>
                  </p>
                  <div className="border border-gray-200 divide-y divide-gray-100">
                    {data.projection.map(row => (
                      <div key={row.year} className="flex items-center gap-3 px-3 py-2">
                        <span className="font-mono text-xs text-gray-400 w-14 flex-shrink-0">
                          {row.year === 0 ? 'start' : `year ${row.year}`}
                        </span>
                        <div className="flex-1 h-4 bg-gray-100 min-w-0">
                          <div
                            className={`h-full ${row.gain >= 0 ? 'bg-gray-900' : 'bg-red-500'}`}
                            style={{ width: `${(row.value / projectionMax) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs text-gray-900 w-28 text-right flex-shrink-0">
                          {money(row.value)}
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
}
