'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { SI_PREFIXES, parseSiPrefixConversion } from './logic';

export const SiPrefixConverter = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '';
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      const result = parseSiPrefixConversion(input);
      setOutput(result.toFormatted);
      setError('');
    } catch (e) {
      setOutput('');
      setError(e instanceof Error ? e.message : 'Invalid input');
    }
  }, [input]);

  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';

  return (
    <Panel
      title="SI Prefix Converter"
      description="Convert between [1 SI prefixes 2] (yotta to yocto) for any unit. Type a value like [1 1000 MHz to GHz 2] or [1 1 km to mm 2]."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">Input (e.g. 1000 MHz to GHz)</label>
            <input
              type="text"
              className={textareaClass}
              placeholder="1000 MHz to GHz"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm font-mono">{error}</p>
          )}

          {output && (
            <div className="flex flex-col gap-2">
              <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">Result</label>
              <div className="bg-gray-50 p-3 border border-gray-200 font-mono text-lg text-gray-900">
                {output}
              </div>
            </div>
          )}

          <div className="w-full h-px bg-gray-200" />

          <div className="flex flex-col gap-2">
            <label className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">SI Prefix Reference</label>
            <div className="overflow-auto">
              <table className="w-full text-sm font-mono">
                <thead>
                  <tr className="text-indigo-300 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="text-left py-2 pr-4">Prefix</th>
                    <th className="text-left py-2 pr-4">Symbol</th>
                    <th className="text-left py-2">Factor</th>
                  </tr>
                </thead>
                <tbody>
                  {SI_PREFIXES.map(p => (
                    <tr key={p.exponent} className="border-b border-gray-200 text-gray-700 hover:text-gray-900 transition-colors">
                      <td className="py-1 pr-4">{p.name}</td>
                      <td className="py-1 pr-4 font-bold text-indigo-200">{p.symbol || '—'}</td>
                      <td className="py-1">
                        10<sup>{p.exponent}</sup>
                        {p.exponent !== 0 && (
                          <span className="text-gray-500 ml-2">
                            = {p.exponent > 0
                                ? (p.exponent <= 12 ? (1 * Math.pow(10, p.exponent)).toLocaleString() : `10^${p.exponent}`)
                                : `0.${'0'.repeat(-p.exponent - 1)}1`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
};
