'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { shannonEntropy } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

function charLabel(ch: string): string {
  if (ch === ' ') return '(space)';
  if (ch === '\n') return '(newline)';
  if (ch === '\t') return '(tab)';
  const code = ch.charCodeAt(0);
  if (code < 32) return `(ctrl-${code})`;
  return `'${ch}'`;
}

function getAssessment(entropy: number): { label: string; color: string } {
  if (entropy < 1.5) return { label: 'Very low — highly repetitive', color: 'text-emerald-700' };
  if (entropy < 3.0) return { label: 'Low — simple structured text', color: 'text-green-700' };
  if (entropy < 4.5) return { label: 'Moderate — typical English prose', color: 'text-yellow-700' };
  if (entropy < 6.0) return { label: 'High — mixed or compressed content', color: 'text-orange-700' };
  if (entropy < 7.0) return { label: 'Very high — random-looking or encoded', color: 'text-red-700' };
  return { label: 'Near-maximum — highly random or encrypted', color: 'text-red-900' };
}

export function TextEntropyCalculator() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const stats = useMemo(() => {
    if (!input.length) return null;
    const entropy = shannonEntropy(input);
    const uniqueChars = new Set(input).size;
    const maxEntropy = uniqueChars > 0 ? Math.log2(uniqueChars) : 0;
    const totalBits = entropy * input.length;

    const freq = new Map<string, number>();
    for (const ch of input) freq.set(ch, (freq.get(ch) ?? 0) + 1);
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    const top10 = sorted.slice(0, 10);
    const maxCount = top10.length > 0 ? top10[0][1] : 1;

    return { entropy, uniqueChars, maxEntropy, totalBits, top10, maxCount };
  }, [input]);

  const assessment = stats ? getAssessment(stats.entropy) : null;

  return (
    <Panel
      title="Text Entropy Calculator"
      description="Calculate [1 Shannon entropy 2] (bits per character) for any text. Includes character frequency distribution, entropy interpretation, and benchmarks for English vs random text."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Input Text</label>
            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm w-full resize-y"
                rows={6}
                placeholder="Paste any text to analyze entropy..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </FileTextArea>
          </div>

          {stats && assessment && (
            <>
              {/* Entropy score */}
              <div className="border-t border-gray-200 pt-4 flex items-baseline gap-3">
                <span className="text-5xl font-black font-mono text-gray-900">{stats.entropy.toFixed(4)}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">bits / character</p>
                  <p className={`text-xs font-bold ${assessment.color}`}>{assessment.label}</p>
                </div>
              </div>

              {/* Entropy bar vs max */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>0</span>
                  <span>Max ({stats.maxEntropy.toFixed(2)} bits)</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div
                    className="h-2 bg-rose-500 transition-all duration-300"
                    style={{ width: stats.maxEntropy > 0 ? `${Math.min((stats.entropy / stats.maxEntropy) * 100, 100)}%` : '0%' }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.maxEntropy > 0 ? ((stats.entropy / stats.maxEntropy) * 100).toFixed(1) : '0'}% of maximum possible entropy
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                {[
                  ['Characters', input.length],
                  ['Unique Chars', stats.uniqueChars],
                  ['Total Bits', stats.totalBits.toFixed(1)],
                  ['Max Entropy', stats.maxEntropy.toFixed(4) + ' bits/char'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
                    <p className="text-xl font-black text-gray-900 font-mono">{value}</p>
                  </div>
                ))}
              </div>

              {/* Benchmarks */}
              <div className="border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Entropy Benchmarks</p>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {([
                      ['English text', '~3.5–4.5 bits/char', stats.entropy >= 3.5 && stats.entropy <= 4.5],
                      ['Random ASCII', '~6.5 bits/char', stats.entropy >= 6.0 && stats.entropy <= 7.0],
                      ['Truly random (256 symbols)', '~8.0 bits/char', stats.entropy >= 7.5],
                    ] as [string, string, boolean][]).map(([label, value, match], i) => (
                      <tr key={label} className={i > 0 ? 'border-t border-gray-200' : ''}>
                        <td className="px-4 py-2 text-gray-500 text-xs">{label}</td>
                        <td className="px-4 py-2 text-gray-900 font-mono text-xs">{value}</td>
                        <td className="px-4 py-2 text-right">
                          {match && <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">matches</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Top character frequency with CSS bars */}
              {stats.top10.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Top {stats.top10.length} Most Frequent Characters
                  </p>
                  <div className="border border-gray-200 overflow-hidden">
                    {stats.top10.map(([ch, count], i) => {
                      const pct = (count / input.length) * 100;
                      const barPct = (count / stats.maxCount) * 100;
                      return (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? 'border-t border-gray-200' : ''}`}>
                          <span className="text-xs font-mono text-gray-600 w-16 flex-shrink-0">{charLabel(ch)}</span>
                          <div className="flex-1 bg-gray-100 h-4 relative overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-rose-400"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-gray-900 w-8 text-right">{count}</span>
                          <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {!input.length && (
            <p className="text-gray-400 text-sm text-center py-4">Paste text above to compute entropy</p>
          )}
        </div>
      }
    />
  );
}
