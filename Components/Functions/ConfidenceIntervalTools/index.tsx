'use client';

import { useState, useEffect } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { computeCI, computeCIFromData, parseNumbers, CIResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';
const fmt = (n: number, d = 4) => n.toFixed(d);

function parseInput(input: string, cl: number): CIResult {
  const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length >= 3) {
    const m = parseFloat(lines[0]);
    const s = parseFloat(lines[1]);
    const n = parseFloat(lines[2]);
    if (!isNaN(m) && !isNaN(s) && !isNaN(n) && Number.isInteger(n) && n >= 2) {
      return computeCI(m, s, n, cl);
    }
  }
  const nums = parseNumbers(input);
  return computeCIFromData(nums, cl);
}

export function ConfidenceInterval() {
  const [input, setInput] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [result, setResult] = useState<CIResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
    const cl = p.get('cl');
    if (cl) {
      const n = parseInt(cl, 10);
      if (n === 90 || n === 95 || n === 99) setConfidenceLevel(n);
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input, cl: confidenceLevel })

  useEffect(() => {
    if (!input.trim()) { setResult(null); setError(''); return; }
    try {
      setResult(parseInput(input, confidenceLevel));
      setError('');
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    }
  }, [input, confidenceLevel]);

  // Visual range: normalize lower/upper bounds to [0,100] for display
  const rangeWidth = result ? result.upperBound - result.lowerBound : 0;
  const spanLabel = result ? `${fmt(result.lowerBound)} — ${fmt(result.upperBound)}` : '';

  return (
    <Panel
      title="Confidence Interval Calculator"
      description="Enter summary stats ([1 mean 2], [1 std dev 2], [1 n 2] — one per line) or raw data (numbers separated by newlines or commas). Uses t-distribution for small samples and z for n ≥ 120."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>Data Input</label>
              <FileTextArea>
                <textarea
                  className={inputClass}
                  rows={5}
                  placeholder={'Summary stats (one per line):\n42.5\n8.3\n25\n\nOr raw data:\n10, 12, 14, 11, 13'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
              </FileTextArea>
            </div>
            <div>
              <label className={labelClass}>Confidence Level</label>
              <select
                className={inputClass}
                value={confidenceLevel}
                onChange={e => setConfidenceLevel(parseInt(e.target.value, 10))}
              >
                <option value={90}>90%</option>
                <option value={95}>95%</option>
                <option value={99}>99%</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {result && (
            <>
              {/* CI visual range */}
              <div className="border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">{result.confidenceLevel}% Confidence Interval</p>
                <div className="relative h-8 bg-gray-100 border border-gray-200 overflow-hidden mb-2">
                  <div
                    className="absolute top-0 bottom-0 bg-emerald-500"
                    style={{ left: '10%', width: '80%' }}
                    title={spanLabel}
                  />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-gray-900" style={{ left: '50%' }} />
                </div>
                <div className="flex justify-between text-xs font-mono text-gray-600">
                  <span>{fmt(result.lowerBound)}</span>
                  <span className="text-gray-400">mean: {fmt(result.mean)}</span>
                  <span>{fmt(result.upperBound)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  We are {result.confidenceLevel}% confident the true population mean lies in [{fmt(result.lowerBound)}, {fmt(result.upperBound)}]
                </p>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                {[
                  ['Sample Mean', fmt(result.mean)],
                  ['Margin of Error', '± ' + fmt(result.marginOfError)],
                  ['Std Deviation', fmt(result.stdDev)],
                  ['Standard Error', fmt(result.standardError)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
                    <p className="text-xl font-black text-gray-900 font-mono">{value}</p>
                  </div>
                ))}
              </div>

              {/* Details table */}
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Sample Size (n)', result.n],
                      ['Degrees of Freedom', result.df],
                      ['Critical Value (' + (result.usingZ ? 'z' : 't') + ')', fmt(result.criticalValue)],
                      ['Distribution', result.usingZ ? 'z (normal, n ≥ 120)' : 't-distribution'],
                    ].map(([label, value], i) => (
                      <tr key={String(label)} className={i > 0 ? 'border-t border-gray-200' : ''}>
                        <td className="px-4 py-2 text-gray-500 text-xs">{label}</td>
                        <td className="px-4 py-2 text-gray-900 font-mono text-right text-xs">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!input.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Enter data above to compute confidence interval</p>
          )}
        </div>
      }
    />
  );
}
