'use client';
import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parseDimensions, simplifyRatio, findCommonName, COMMON_WIDTHS } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export function AspectRatioCalc() {
  const [input, setInput] = useState('1920x1080');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      const { width, height } = parseDimensions(input);
      const { rw, rh } = simplifyRatio(width, height);
      const decimal = width / height;
      const commonName = findCommonName(rw, rh);
      return { width, height, rw, rh, decimal, commonName, error: null };
    } catch (e) {
      return { width: 0, height: 0, rw: 0, rh: 0, decimal: 0, commonName: null, error: (e as Error).message };
    }
  }, [input]);

  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

  return (
    <Panel
      title="Aspect Ratio Calculator"
      description="Enter width and height in any format: [1 1920x1080 2], [1 1920 1080 2], or [1 16:9 2]. Get simplified ratio, common name, and equivalent pixel sizes at common breakpoints."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input */}
          <div>
            <label className={`${labelClass} block mb-1`}>Dimensions</label>
            <input
              className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm"
              placeholder="e.g. 1920x1080 or 16:9"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {result?.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{result.error}</div>
          )}

          {result && !result.error && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Simplified Ratio</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">{result.rw}:{result.rh}</p>
                  {result.commonName && (
                    <p className="text-xs text-gray-400 mt-0.5">{result.commonName}</p>
                  )}
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Input</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">{result.width}×{result.height}</p>
                  <p className="text-xs text-gray-400 mt-0.5">decimal {result.decimal.toFixed(4)}</p>
                </div>
              </div>

              {/* Breakpoints table */}
              <div>
                <p className={`${labelClass} mb-2`}>Equivalent Sizes at Common Widths</p>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Width</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Height</th>
                        <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 hidden sm:table-cell">vs Input</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COMMON_WIDTHS.map((w, i) => {
                        const h = Math.round((w * result.rh) / result.rw);
                        const isCurrent = w === result.width;
                        return (
                          <tr key={w} className={`${i > 0 ? 'border-t border-gray-200' : ''} ${isCurrent ? 'bg-lime-50' : ''}`}>
                            <td className={`px-4 py-2 font-mono ${isCurrent ? 'font-black text-gray-900' : 'text-gray-900'}`}>{w}</td>
                            <td className={`px-4 py-2 font-mono ${isCurrent ? 'font-black text-gray-900' : 'text-gray-900'}`}>{h}</td>
                            <td className="px-4 py-2 text-gray-400 text-xs hidden sm:table-cell">
                              {isCurrent ? 'input' : w < result.width ? `${(result.width / w).toFixed(1)}× smaller` : `${(w / result.width).toFixed(1)}× larger`}
                            </td>
                          </tr>
                        );
                      })}
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
