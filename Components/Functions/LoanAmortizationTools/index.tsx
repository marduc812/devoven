'use client';
import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calculateLoanAmortization, LoanAmortResult, TermUnit } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function LoanAmortizationCalculator() {
  const [loanAmount, setLoanAmount] = useState('');
  const [rate, setRate] = useState('');
  const [term, setTerm] = useState('');
  const [termUnit, setTermUnit] = useState<TermUnit>('years');
  const [result, setResult] = useState<LoanAmortResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) {
      const lines = from.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines[0]) setLoanAmount(lines[0]);
      if (lines[1]) setRate(lines[1]);
      if (lines[2]) setTerm(lines[2]);
    }
    const u = p.get('unit');
    if (u === 'months' || u === 'years') setTermUnit(u);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: [loanAmount, rate, term].join('\n'), unit: termUnit })

  useEffect(() => {
    if (!loanAmount.trim() || !rate.trim() || !term.trim()) { setResult(null); setError(''); return; }
    try {
      const r = calculateLoanAmortization({
        loanAmount: parseFloat(loanAmount),
        annualRate: parseFloat(rate),
        term: parseFloat(term),
        termUnit,
      });
      setResult(r);
      setError('');
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    }
  }, [loanAmount, rate, term, termUnit]);

  return (
    <Panel
      title="Loan Amortization Calculator"
      description="Enter [1 loan amount 2], [1 annual interest rate % 2], and [1 term 2] to see monthly payment, total cost, and a month-by-month [1 amortization schedule 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Loan Amount</label>
              <input type="number" className={inputClass} placeholder="e.g. 250000" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Annual Rate (%)</label>
              <input type="number" className={inputClass} placeholder="e.g. 5.5" value={rate} onChange={e => setRate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Term</label>
              <input type="number" className={inputClass} placeholder="e.g. 30" value={term} onChange={e => setTerm(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Term Unit</label>
              <select className={inputClass} value={termUnit} onChange={e => setTermUnit(e.target.value as TermUnit)}>
                <option value="years">Years</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {result && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Monthly Payment</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">${fmt(result.monthlyPayment)}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Payment</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">${fmt(result.totalPayment)}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Interest</p>
                  <p className="text-2xl font-black text-red-700 font-mono">${fmt(result.totalInterest)}</p>
                </div>
              </div>

              {/* Principal vs Interest bar */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Principal vs Interest</p>
                <div className="flex h-4 border border-gray-200 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${result.principalPct}%` }} title={`Principal ${result.principalPct.toFixed(1)}%`} />
                  <div className="bg-red-400 h-full" style={{ width: `${result.interestPct}%` }} title={`Interest ${result.interestPct.toFixed(1)}%`} />
                </div>
                <div className="flex gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-emerald-500" />Principal {result.principalPct.toFixed(1)}%</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 bg-red-400" />Interest {result.interestPct.toFixed(1)}%</span>
                  <span className="ml-auto">{result.totalMonths} months total</span>
                </div>
              </div>

              {/* Schedule table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Amortization Schedule {result.schedule.length < result.totalMonths ? `(first ${result.schedule.length} months)` : ''}
                </p>
                <div className="border border-gray-200 overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Mo.', 'Payment', 'Principal', 'Interest', 'Balance', 'Cum. Principal', 'Cum. Interest'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map((row, i) => (
                        <tr key={row.month} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <td className="px-3 py-1.5 text-gray-500 text-xs">{row.month}</td>
                          <td className="px-3 py-1.5 text-gray-900 font-mono text-xs">${fmt(row.payment)}</td>
                          <td className="px-3 py-1.5 text-emerald-700 font-mono text-xs">${fmt(row.principal)}</td>
                          <td className="px-3 py-1.5 text-red-600 font-mono text-xs">${fmt(row.interest)}</td>
                          <td className="px-3 py-1.5 text-gray-900 font-mono text-xs">${fmt(row.balance)}</td>
                          <td className="px-3 py-1.5 text-gray-500 font-mono text-xs">${fmt(row.cumulativePrincipal)}</td>
                          <td className="px-3 py-1.5 text-gray-500 font-mono text-xs">${fmt(row.cumulativeInterest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!loanAmount && !rate && !term && (
            <p className="text-gray-400 text-sm text-center py-4">Enter loan details above to calculate</p>
          )}
        </div>
      }
    />
  );
}
