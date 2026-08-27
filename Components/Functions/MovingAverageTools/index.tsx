'use client';

import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parseNumbers, computeSMA, computeEMA, computeWMA, MAType } from './logic';

const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';
const fmt = (n: number) => n.toFixed(4);

export function MovingAverage() {
  const [input, setInput] = useState('');
  const [maType, setMaType] = useState<MAType>('sma');
  const [windowSize, setWindowSize] = useState(3);
  const [error, setError] = useState('');
  const [data, setData] = useState<number[]>([]);
  const [values, setValues] = useState<Array<number | null>>([]);
  const [label, setLabel] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
    const t = p.get('type');
    if (t === 'sma' || t === 'ema' || t === 'wma') setMaType(t as MAType);
    const w = p.get('window');
    if (w) { const n = parseInt(w, 10); if (n > 0) setWindowSize(n); }
  }, []);

  useEffect(() => {
    if (!input.trim()) { setData([]); setValues([]); setError(''); return; }
    try {
      const parsed = parseNumbers(input);
      if (parsed.length === 0) { setData([]); setValues([]); return; }
      if (windowSize < 1) throw new Error('Window size must be at least 1.');
      if (windowSize > parsed.length) throw new Error(`Window size (${windowSize}) exceeds data length (${parsed.length}).`);

      let computed: Array<number | null>;
      let lbl: string;
      switch (maType) {
        case 'sma':
          computed = computeSMA(parsed, windowSize);
          lbl = `SMA(${windowSize})`;
          break;
        case 'ema':
          computed = computeEMA(parsed, windowSize);
          lbl = `EMA(${windowSize}, α=${(2 / (windowSize + 1)).toFixed(4)})`;
          break;
        case 'wma':
          computed = computeWMA(parsed, windowSize);
          lbl = `WMA(${windowSize})`;
          break;
        default:
          throw new Error('Unknown MA type.');
      }
      setData(parsed);
      setValues(computed);
      setLabel(lbl);
      setError('');
    } catch (e) {
      setData([]);
      setValues([]);
      setError((e as Error).message);
    }
  }, [input, maType, windowSize]);

  const hasResult = data.length > 0 && values.length > 0;
  const maTypeLabel = { sma: 'Simple Moving Average', ema: 'Exponential Moving Average', wma: 'Weighted Moving Average' }[maType];

  // Stats for summary
  const validValues = values.filter((v): v is number => v !== null);
  const maMin = validValues.length ? Math.min(...validValues) : null;
  const maMax = validValues.length ? Math.max(...validValues) : null;
  const maLast = validValues.length ? validValues[validValues.length - 1] : null;

  return (
    <Panel
      title="Moving Average Calculator"
      description="Enter a series of numbers (one per line). Computes [1 Simple Moving Average (SMA) 2], [1 Exponential Moving Average (EMA) 2] with auto smoothing factor, or [1 Weighted Moving Average (WMA) 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Numbers (one per line)</label>
              <textarea
                className={inputClass}
                rows={6}
                placeholder={'10\n12\n14\n11\n13\n15\n12'}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>MA Type</label>
              <select
                className={inputClass}
                value={maType}
                onChange={e => setMaType(e.target.value as MAType)}
              >
                <option value="sma">SMA (Simple)</option>
                <option value="ema">EMA (Exponential)</option>
                <option value="wma">WMA (Weighted)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Window Size</label>
              <input
                type="number"
                className={inputClass}
                min={1}
                value={windowSize}
                onChange={e => setWindowSize(parseInt(e.target.value, 10) || 3)}
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {hasResult && (
            <>
              {/* Summary cards */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{maTypeLabel} — {label}</p>
                <div className="grid grid-cols-3 gap-px bg-gray-200">
                  <div className="bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Last Value</p>
                    <p className="text-2xl font-black text-gray-900 font-mono">{maLast !== null ? fmt(maLast) : '—'}</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Min</p>
                    <p className="text-2xl font-black text-emerald-700 font-mono">{maMin !== null ? fmt(maMin) : '—'}</p>
                  </div>
                  <div className="bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Max</p>
                    <p className="text-2xl font-black text-blue-700 font-mono">{maMax !== null ? fmt(maMax) : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Data table */}
              <div className="border border-gray-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['#', 'Data', label, 'Status'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((d, i) => {
                      const v = values[i];
                      return (
                        <tr key={i} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <td className="px-3 py-1.5 text-gray-400 text-xs font-mono">{i + 1}</td>
                          <td className="px-3 py-1.5 text-gray-900 font-mono text-xs">{d}</td>
                          <td className="px-3 py-1.5 font-mono text-xs text-emerald-700">
                            {v !== null ? fmt(v) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-3 py-1.5 text-xs">
                            {v === null
                              ? <span className="text-gray-400">insufficient data</span>
                              : <span className="text-emerald-600">computed</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {maType === 'ema' && (
                <p className="text-xs text-gray-400">EMA uses smoothing factor α = 2 / (window + 1) = {(2 / (windowSize + 1)).toFixed(4)}. First value seeds the EMA.</p>
              )}
            </>
          )}

          {!input.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Enter numbers above to compute moving average</p>
          )}
        </div>
      }
    />
  );
}
