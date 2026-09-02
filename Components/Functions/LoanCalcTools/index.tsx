'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calculateLoan, parseLoanInput, fullAmortization, yearlyAmortization } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const moneyShort = (n: number) =>
  `$${Math.round(n).toLocaleString('en-US')}`;

export function LoanCalculator() {
  const [principal, setPrincipal] = useState('250000');
  const [rate, setRate] = useState('5.5');
  const [term, setTerm] = useState('30');
  const [showAllMonths, setShowAllMonths] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) {
      // Legacy share links carry the three values as newline-separated text.
      try {
        const parsed = parseLoanInput(from);
        setPrincipal(String(parsed.principal));
        setRate(String(parsed.annualRate));
        setTerm(String(parsed.termYears));
        return;
      } catch {
        /* fall through to the individual params */
      }
    }
    if (p.get('principal')) setPrincipal(p.get('principal') as string);
    if (p.get('rate')) setRate(p.get('rate') as string);
    if (p.get('term')) setTerm(p.get('term') as string);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ principal, rate, term })

  const result = useMemo(() => {
    const amount = parseFloat(principal);
    const annualRate = parseFloat(rate);
    const termYears = parseFloat(term);

    if (isNaN(amount) || isNaN(annualRate) || isNaN(termYears)) {
      return { data: null, error: 'Enter an amount, an annual rate, and a term in years' };
    }
    if (termYears > 60) return { data: null, error: 'Term is capped at 60 years' };

    const inputs = { principal: amount, annualRate, termYears };
    try {
      const loan = calculateLoan(inputs);
      const years = yearlyAmortization(inputs);
      const months = fullAmortization(inputs);
      // The closing instalment is trimmed to whatever is left, so the schedule is
      // the honest total rather than payment × number of payments.
      const totalPaid = months.reduce((sum, row) => sum + row.payment, 0);
      const totalInterest = months.reduce((sum, row) => sum + row.interest, 0);

      return {
        data: {
          inputs,
          loan,
          years,
          months,
          totalPaid,
          totalInterest,
          interestRatio: totalInterest / amount,
          // The month the balance first crosses below half the original loan: the
          // point where payments stop being mostly interest.
          halfwayMonth: months.find(row => row.balance <= amount / 2)?.month ?? null,
        },
        error: null,
      };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Could not calculate the loan' };
    }
  }, [principal, rate, term]);

  const data = result.data;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  const principalShare = data ? (data.inputs.principal / data.totalPaid) * 100 : 100;
  const yearScale = data ? Math.max(...data.years.map(y => y.payment), 1) : 1;
  const visibleMonths = data ? (showAllMonths ? data.months : data.months.slice(0, 12)) : [];

  return (
    <Panel
      title="Loan / Mortgage Calculator"
      description="Enter the amount borrowed, the annual interest rate, and the term. Gives the level [1 monthly payment 2], what the loan costs in total, how the split between interest and principal shifts over time, and the full amortization schedule."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Loan Amount</label>
              <input className={inputClass} placeholder="250000" value={principal} onChange={e => setPrincipal(e.target.value)} />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Annual Rate %</label>
              <input className={inputClass} placeholder="5.5" value={rate} onChange={e => setRate(e.target.value)} />
              <input
                type="range"
                min={0}
                max={20}
                step={0.05}
                value={isNaN(parseFloat(rate)) ? 5.5 : Math.min(20, Math.max(0, parseFloat(rate)))}
                onChange={e => setRate(e.target.value)}
                className="w-full mt-2 accent-gray-900"
                aria-label="Annual rate"
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Term (years)</label>
              <input className={inputClass} placeholder="30" value={term} onChange={e => setTerm(e.target.value)} />
              <input
                type="range"
                min={1}
                max={40}
                step={1}
                value={isNaN(parseFloat(term)) ? 30 : Math.min(40, Math.max(1, parseFloat(term)))}
                onChange={e => setTerm(e.target.value)}
                className="w-full mt-2 accent-gray-900"
                aria-label="Term in years"
              />
            </div>
          </div>

          {result.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{result.error}</div>
          )}

          {data && (
            <>
              {/* Headline */}
              <div className="bg-gray-900 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">Monthly Payment</p>
                <p className="text-4xl font-black text-white leading-none">{money(data.loan.monthlyPayment)}</p>
                <p className="text-sm text-gray-300 mt-2 font-mono">
                  {data.months.length} payments · {moneyShort(data.inputs.principal)} at {data.inputs.annualRate}%
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Total Paid</p>
                  <p className="text-2xl font-black text-gray-900">{moneyShort(data.totalPaid)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">over {data.inputs.termYears}y</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Total Interest</p>
                  <p className="text-2xl font-black text-gray-900">{moneyShort(data.totalInterest)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">cost of borrowing</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Interest / Principal</p>
                  <p className="text-2xl font-black text-gray-900">{(data.interestRatio * 100).toFixed(0)}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {data.interestRatio >= 1 ? 'more interest than loan' : 'of the amount borrowed'}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Half Repaid</p>
                  <p className="text-2xl font-black text-gray-900">
                    {data.halfwayMonth === null ? '—' : `${(data.halfwayMonth / 12).toFixed(1)}y`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">balance hits 50%</p>
                </div>
              </div>

              {/* Where the money goes */}
              <div>
                <p className={`${labelClass} mb-2`}>Where Every Payment Goes</p>
                <div className="flex h-10 border border-gray-200">
                  <div
                    className="bg-gray-900 flex items-center justify-center overflow-hidden"
                    style={{ width: `${principalShare}%` }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white px-2 whitespace-nowrap">
                      Principal {principalShare.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    className="bg-emerald-500 flex items-center justify-center overflow-hidden"
                    style={{ width: `${100 - principalShare}%` }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white px-2 whitespace-nowrap">
                      Interest {(100 - principalShare).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-[10px] font-mono text-gray-400">
                  <span>{moneyShort(data.inputs.principal)}</span>
                  <span>{moneyShort(data.totalInterest)}</span>
                </div>
              </div>

              {/* Year by year */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Year by Year{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (each bar is one year of payments, split into interest and principal)
                  </span>
                </p>
                <div className="border border-gray-200 divide-y divide-gray-100">
                  {data.years.map(row => (
                    <div key={row.year} className="flex items-center gap-3 px-3 py-2">
                      <span className="font-mono text-xs text-gray-400 w-8 flex-shrink-0">Y{row.year}</span>
                      <div className="flex-1 flex h-4 min-w-0 bg-gray-50">
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${(row.interest / yearScale) * 100}%` }}
                          title={`Interest ${money(row.interest)}`}
                        />
                        <div
                          className="bg-gray-900"
                          style={{ width: `${(row.principal / yearScale) * 100}%` }}
                          title={`Principal ${money(row.principal)}`}
                        />
                      </div>
                      <span className="font-mono text-xs text-emerald-600 w-20 text-right flex-shrink-0">
                        {moneyShort(row.interest)}
                      </span>
                      <span className="font-mono text-xs text-gray-900 w-20 text-right flex-shrink-0">
                        {moneyShort(row.principal)}
                      </span>
                      <span className="font-mono text-xs text-gray-400 w-24 text-right flex-shrink-0 hidden sm:block">
                        {moneyShort(row.balance)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-5 mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 inline-block" /> interest</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-gray-900 inline-block" /> principal</span>
                  <span className="hidden sm:inline">right column = balance left</span>
                </div>
              </div>

              {/* Amortization schedule */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={labelClass}>Amortization Schedule</p>
                  {data.months.length > 12 && (
                    <button
                      className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
                      onClick={() => setShowAllMonths(v => !v)}
                    >
                      {showAllMonths ? 'Show first year' : `Show all ${data.months.length} months`}
                    </button>
                  )}
                </div>
                <div className={`border border-gray-200 overflow-x-auto ${showAllMonths ? 'max-h-96 overflow-y-auto' : ''}`}>
                  <table className="w-full text-xs font-mono">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-gray-500 uppercase tracking-wider">
                        <th className="text-left font-bold px-3 py-2">Month</th>
                        <th className="text-right font-bold px-3 py-2">Payment</th>
                        <th className="text-right font-bold px-3 py-2">Interest</th>
                        <th className="text-right font-bold px-3 py-2">Principal</th>
                        <th className="text-right font-bold px-3 py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visibleMonths.map(row => (
                        <tr key={row.month}>
                          <td className="px-3 py-1.5 text-gray-400">{row.month}</td>
                          <td className="px-3 py-1.5 text-right text-gray-900">{money(row.payment)}</td>
                          <td className="px-3 py-1.5 text-right text-emerald-600">{money(row.interest)}</td>
                          <td className="px-3 py-1.5 text-right text-gray-900">{money(row.principal)}</td>
                          <td className="px-3 py-1.5 text-right text-gray-500">{money(row.balance)}</td>
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
