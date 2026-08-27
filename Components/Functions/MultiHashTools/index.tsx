'use client';

import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { computeAllHashes, HashResult } from './logic';

const inputClass =
  'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';
const labelClass = 'text-xs text-gray-400 uppercase tracking-wider mb-2 block';

export function MultiHashCalculator() {
  const [input, setInput] = useState('');
  const [expected, setExpected] = useState('');
  const [results, setResults] = useState<HashResult[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setResults([]);
      return;
    }
    setResults(computeAllHashes(input, expected));
  }, [input, expected]);

  return (
    <Panel
      title="Multi-Hash Calculator"
      description="Compute multiple hash algorithms at once for any input text. Optionally provide an expected hash to highlight which algorithm matches."
      backColor="teal"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Input Text</label>
            <textarea
              className={`${inputClass} min-h-[80px]`}
              placeholder="Enter text to hash..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Expected Hash (optional — paste to highlight matches)</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Paste a hash to compare..."
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
            />
          </div>
          {results.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-mono border-collapse">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-200">
                    <th className="text-left py-2 pr-4 w-28">Algorithm</th>
                    <th className="text-left py-2">Hash Value</th>
                    {results[0].matches !== null && (
                      <th className="text-left py-2 pl-4 w-24">Match</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const isMatch = r.matches === true;
                    const isMiss = r.matches === false;
                    return (
                      <tr
                        key={r.algorithm}
                        className={`border-b border-gray-200 ${
                          isMatch
                            ? 'bg-green-500/10'
                            : isMiss
                            ? ''
                            : ''
                        }`}
                      >
                        <td className="py-2 pr-4 text-gray-400 text-xs">{r.algorithm}</td>
                        <td
                          className={`py-2 break-all text-xs ${
                            isMatch ? 'text-green-700' : 'text-gray-200'
                          }`}
                        >
                          {r.value}
                        </td>
                        {r.matches !== null && (
                          <td className="py-2 pl-4">
                            {isMatch ? (
                              <span className="text-green-400 font-semibold">✓ Match</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      }
    />
  );
}
