'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calculateDcf, parseDcfInput, discountedPayback, npvSensitivity } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const money = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const moneyExact = (n: number) =>
  `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const DEFAULT_FLOWS = ['-100000', '25000', '30000', '35000', '40000', '45000'];

export function DcfCalculator() {
  const [rate, setRate] = useState('10');
  const [flows, setFlows] = useState<string[]>(DEFAULT_FLOWS);

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (!from) return;
    // Legacy share links carry the rate on line 1 and one cash flow per line after it.
    try {
      const parsed = parseDcfInput(from);
      setRate(String(parsed.discountRate));
      setFlows(parsed.cashFlows.map(String));
    } catch {
      /* keep the defaults */
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: [rate, ...flows].join('\n') })

  const result = useMemo(() => {
    const r = parseFloat(rate);
    if (isNaN(r)) return { data: null, error: 'Enter a discount rate (e.g. 10 for 10%)' };

    const cashFlows: number[] = [];
    for (let i = 0; i < flows.length; i++) {
      const raw = flows[i].trim();
      if (raw === '') return { data: null, error: `Year ${i} is empty — enter a cash flow or remove the row` };
      const val = parseFloat(raw);
      if (isNaN(val)) return { data: null, error: `Year ${i} is not a number: "${flows[i]}"` };
      cashFlows.push(val);
    }

    try {
      const dcf = calculateDcf({ discountRate: r, cashFlows });
      return {
        data: {
          rate: r,
          dcf,
          payback: discountedPayback(dcf.rows),
          curve: npvSensitivity(cashFlows, Math.max(40, r * 2)),
          totalUndiscounted: cashFlows.reduce((a, b) => a + b, 0),
        },
        error: null,
      };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Could not run the DCF' };
    }
  }, [rate, flows]);

  const data = result.data;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  const setFlow = (i: number, v: string) => setFlows(f => f.map((x, j) => (j === i ? v : x)));
  const addFlow = () => setFlows(f => [...f, '0']);
  const removeFlow = (i: number) => setFlows(f => (f.length > 2 ? f.filter((_, j) => j !== i) : f));

  // Flow bars diverge from a shared centre line so inflows and outflows read at a glance.
  const flowScale = data ? Math.max(...data.dcf.rows.map(r => Math.abs(r.cashFlow)), 1) : 1;
  const curveMax = data ? Math.max(...data.curve.map(p => Math.abs(p.npv)), 1) : 1;

  return (
    <Panel
      title="DCF Calculator"
      description="Discount a series of cash flows back to today. Year 0 is your initial outlay (negative); every year after is a projected return. Gives [1 NPV 2], [1 IRR 2], discounted payback, and a sensitivity curve showing how the NPV moves as the discount rate changes."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Discount rate */}
          <div>
            <label className={`${labelClass} block mb-1`}>Discount Rate</label>
            <div className="flex items-center gap-4">
              <input
                className={`${inputClass} w-28 flex-shrink-0`}
                value={rate}
                onChange={e => setRate(e.target.value)}
              />
              <span className="text-sm font-bold text-gray-400">%</span>
              <input
                type="range"
                min={0}
                max={40}
                step={0.5}
                value={isNaN(parseFloat(rate)) ? 10 : Math.min(40, Math.max(0, parseFloat(rate)))}
                onChange={e => setRate(e.target.value)}
                className="flex-1 accent-gray-900"
              />
            </div>
          </div>

          {/* Cash flows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className={labelClass}>Cash Flows</p>
              <button
                className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
                onClick={addFlow}
              >
                + Add year
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {flows.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {i === 0 ? 'Year 0 — outlay' : `Year ${i}`}
                    </label>
                    {flows.length > 2 && (
                      <button
                        className="text-[10px] font-bold uppercase text-gray-400 hover:text-red-600"
                        onClick={() => removeFlow(i)}
                        title="Remove this year"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <input className={inputClass} value={f} onChange={e => setFlow(i, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          {result.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{result.error}</div>
          )}

          {data && (
            <>
              {/* Verdict */}
              <div className={`p-6 ${data.dcf.isWorthwhile ? 'bg-gray-900' : 'bg-red-600'}`}>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Net Present Value at {data.rate}%
                </p>
                <p className="text-4xl font-black text-white leading-none">{moneyExact(data.dcf.npv)}</p>
                <p className="text-sm text-gray-300 mt-2">
                  {data.dcf.isWorthwhile
                    ? 'Creates value at this discount rate.'
                    : 'Destroys value at this discount rate.'}
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>IRR</p>
                  <p className="text-2xl font-black text-gray-900">
                    {data.dcf.irr === null ? '—' : `${(data.dcf.irr * 100).toFixed(2)}%`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data.dcf.irr === null ? 'no real root' : `hurdle ${data.rate}%`}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Payback</p>
                  <p className="text-2xl font-black text-gray-900">
                    {data.payback === null ? '—' : `${data.payback.toFixed(1)}y`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">discounted</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Undiscounted</p>
                  <p className="text-2xl font-black text-gray-900">{money(data.totalUndiscounted)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">sum of flows</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Time Cost</p>
                  <p className="text-2xl font-black text-gray-900">{money(data.totalUndiscounted - data.dcf.npv)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">lost to discounting</p>
                </div>
              </div>

              {/* Per-year flows */}
              <div>
                <p className={`${labelClass} mb-2`}>Cash Flow vs Present Value</p>
                <div className="border border-gray-200 divide-y divide-gray-100">
                  {data.dcf.rows.map(row => (
                    <div key={row.year} className="flex items-center gap-3 px-3 py-2">
                      <span className="font-mono text-xs text-gray-400 w-12 flex-shrink-0">Y{row.year}</span>
                      <div className="flex-1 relative h-8 min-w-0">
                        {/* Centre line = zero */}
                        <div className="absolute inset-y-0 left-1/2 w-px bg-gray-200" />
                        {/* Nominal cash flow, faint */}
                        <div
                          className={`absolute top-0.5 h-3 ${row.cashFlow >= 0 ? 'bg-gray-300 left-1/2' : 'bg-red-200 right-1/2'}`}
                          style={{ width: `${(Math.abs(row.cashFlow) / flowScale) * 50}%` }}
                        />
                        {/* Present value, solid */}
                        <div
                          className={`absolute bottom-0.5 h-3 ${row.presentValue >= 0 ? 'bg-gray-900 left-1/2' : 'bg-red-500 right-1/2'}`}
                          style={{ width: `${(Math.abs(row.presentValue) / flowScale) * 50}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-gray-400 w-24 text-right flex-shrink-0">
                        {money(row.cashFlow)}
                      </span>
                      <span className="font-mono text-xs text-gray-900 w-24 text-right flex-shrink-0">
                        {money(row.presentValue)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-gray-300 inline-block" /> nominal</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-gray-900 inline-block" /> present value</span>
                </div>
              </div>

              {/* Sensitivity curve */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  NPV vs Discount Rate{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (crosses zero at the IRR)
                  </span>
                </p>
                <div className="border border-gray-200 p-4">
                  <div className="relative h-32 flex items-end gap-px">
                    {/* Zero line sits at the vertical middle of the plot */}
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-300" />
                    {data.curve.map((p, i) => {
                      const h = (Math.abs(p.npv) / curveMax) * 50;
                      const isCurrent = Math.abs(p.rate - data.rate) < 0.6;
                      return (
                        <div key={i} className="flex-1 h-full relative" title={`${p.rate.toFixed(1)}% → ${money(p.npv)}`}>
                          <div
                            className={`absolute left-0 right-0 ${
                              isCurrent ? 'bg-emerald-500' : p.npv >= 0 ? 'bg-gray-900' : 'bg-red-400'
                            }`}
                            style={
                              p.npv >= 0
                                ? { bottom: '50%', height: `${h}%` }
                                : { top: '50%', height: `${h}%` }
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-400">
                    <span>0%</span>
                    <span>
                      {data.dcf.irr === null
                        ? 'no IRR in range'
                        : `IRR ${(data.dcf.irr * 100).toFixed(2)}%`}
                    </span>
                    <span>{data.curve[data.curve.length - 1].rate.toFixed(0)}%</span>
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
