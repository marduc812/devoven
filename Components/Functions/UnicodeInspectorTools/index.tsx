'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { inspectText, type InspectionResult, type CharInfo } from './logic';

const SAMPLE = 'Hello 🌍 café résumé';

const categoryColors: Record<string, string> = {
  Lu: 'text-blue-300', Ll: 'text-blue-200', Lt: 'text-blue-300',
  Nd: 'text-green-700',
  Mn: 'text-orange-300', Mc: 'text-orange-300', Me: 'text-orange-300',
  Sm: 'text-purple-300', Sc: 'text-purple-300', So: 'text-yellow-300',
  Zs: 'text-gray-500',
  Cc: 'text-red-400', Cf: 'text-red-300',
  Po: 'text-gray-300', Ps: 'text-gray-300', Pe: 'text-gray-300',
  Lo: 'text-teal-300',
};

const CharRow = ({ char }: { char: CharInfo }) => {
  const displayChar = char.char === '\n' ? '↵' : char.char === '\t' ? '→' : char.char === ' ' ? '·' : char.char;
  const colorClass = categoryColors[char.category] || 'text-gray-200';

  return (
    <tr className="border-b border-gray-200 hover:bg-white/3 transition-colors">
      <td className="px-3 py-1.5 text-center">
        <span className={`font-mono text-sm ${colorClass}`} title={char.name}>
          {displayChar}
        </span>
        {char.isEmoji && <span className="ml-1 text-xs text-yellow-500">✦</span>}
        {char.isCombining && <span className="ml-1 text-xs text-orange-500">◌</span>}
      </td>
      <td className="px-3 py-1.5 font-mono text-xs text-gray-700">{char.codePointStr}</td>
      <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{char.decimal}</td>
      <td className="px-3 py-1.5 font-mono text-xs text-gray-400">{char.utf8Bytes}</td>
      <td className="px-3 py-1.5 font-mono text-xs text-gray-500">{char.utf16Units}</td>
      <td className="px-3 py-1.5 text-xs text-gray-400">{char.categoryName}</td>
      <td className="px-3 py-1.5 text-xs text-gray-500 max-w-48 truncate">{char.name}</td>
    </tr>
  );
};

export const UnicodeInspector = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [maxRows, setMaxRows] = useState(100);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from') || '';
    if (from) setInput(decodeURIComponent(from));
  }, []);

  useEffect(() => {
    if (!input) {
      setResult(null);
      return;
    }
    setResult(inspectText(input));
    setMaxRows(100);
  }, [input]);

  return (
    <Panel
      backColor="lime"
      title="Unicode Character Inspector"
      description="Inspect every character in your text: Unicode code point (U+XXXX), decimal, UTF-8 bytes, UTF-16 code units, and character category. Handles emoji, combining marks, surrogate pairs, and multi-byte characters."
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">Input Text</label>
              <button
                className="text-xs text-gray-700 hover:text-gray-700 transition-colors"
                onClick={() => setInput(SAMPLE)}
              >
                Load Sample
              </button>
            </div>
            <textarea
              className="bg-white text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none font-mono text-sm resize-none"
              rows={3}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type or paste any text, including emoji 😀, accented chars, CJK, etc..."
              spellCheck={false}
            />
          </div>

          {result && result.chars.length > 0 && (
            <>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-gray-500 mb-0.5">Code Points</div>
                  <div className="text-gray-700 font-mono font-bold">{result.totalCodePoints}</div>
                </div>
                <div className="border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-gray-500 mb-0.5">UTF-8 Bytes</div>
                  <div className="text-yellow-300 font-mono font-bold">{result.utf8TotalBytes}</div>
                </div>
                <div className="border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-gray-500 mb-0.5">UTF-16 Bytes</div>
                  <div className="text-blue-300 font-mono font-bold">{result.utf16TotalBytes}</div>
                </div>
              </div>

              <div className="text-xs text-gray-600 flex gap-4 flex-wrap">
                <span><span className="text-yellow-500">✦</span> Emoji</span>
                <span><span className="text-orange-500">◌</span> Combining mark</span>
              </div>

              <div className="overflow-auto border border-gray-200">
                <table className="w-full text-left min-w-max">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white">
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Char</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Code Point</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Decimal</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">UTF-8 Bytes</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">UTF-16</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Category</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.chars.slice(0, maxRows).map((c, i) => (
                      <CharRow key={i} char={c} />
                    ))}
                  </tbody>
                </table>
              </div>

              {result.chars.length > maxRows && (
                <button
                  className="text-xs text-gray-700 hover:text-gray-700 transition-colors text-center"
                  onClick={() => setMaxRows(prev => prev + 200)}
                >
                  Show more ({result.chars.length - maxRows} remaining)
                </button>
              )}
            </>
          )}

          {!input && (
            <p className="text-gray-400 text-sm text-center py-4">
              Enter text above to inspect each character
            </p>
          )}
        </div>
      }
    />
  );
};
