'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeInput, UNICODE_BLOCKS } from './logic';
import type { CharInfo } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const UnicodeLookup = () => {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = input.trim() ? analyzeInput(input) : null;
  const chars: CharInfo[] = Array.isArray(result) ? result : [];
  const errorMsg: string = typeof result === 'string' ? result : '';

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 text-sm font-mono';

  const rowClass = 'border-b border-gray-200';
  const labelClass = 'py-1.5 pr-3 text-gray-400 text-xs whitespace-nowrap align-top';
  const valueClass = 'py-1.5 font-mono text-gray-900 text-xs break-all';

  return (
    <Panel
      title="Unicode Character Lookup"
      description="Enter a character, [1 U+1F600 2] code point, hex [1 0x41 2], or decimal number to see UTF-8 bytes, UTF-16 units, HTML entity, CSS escape, and JS escape."
      backColor="yellow"
      extraElements={
        <div className="flex flex-col gap-4 w-full">
          <input
            className={inputClass}
            placeholder="e.g. A  or  U+1F600  or  0x41  or  65"
            value={input}
            onChange={e => setInput(e.target.value)}
          />

          {errorMsg && !chars.length && input.trim() && (
            <p className="text-gray-400 text-xs">{errorMsg}</p>
          )}

          {chars.length > 0 && (
            <div className="flex flex-col gap-6">
              {chars.map((c, idx) => (
                <div key={idx} className="border border-gray-200 bg-gray-50 p-4">
                  <div className="text-4xl text-center mb-4 select-all">{c.char}</div>
                  <table className="w-full">
                    <tbody>
                      <tr className={rowClass}>
                        <td className={labelClass}>Code Point</td>
                        <td className={valueClass}>{c.codePointStr} (decimal: {c.codePoint})</td>
                      </tr>
                      <tr className={rowClass}>
                        <td className={labelClass}>UTF-8 Bytes</td>
                        <td className={valueClass}>{c.utf8Bytes}</td>
                      </tr>
                      <tr className={rowClass}>
                        <td className={labelClass}>UTF-16 Units</td>
                        <td className={valueClass}>{c.utf16Units}</td>
                      </tr>
                      <tr className={rowClass}>
                        <td className={labelClass}>HTML Entity</td>
                        <td className={valueClass}>{c.htmlEntity}</td>
                      </tr>
                      <tr className={rowClass}>
                        <td className={labelClass}>CSS Escape</td>
                        <td className={valueClass}>{c.cssEscape}</td>
                      </tr>
                      <tr className={rowClass}>
                        <td className={labelClass}>JS Escape</td>
                        <td className={valueClass}>{c.jsEscape}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4">
            <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">Common Unicode Blocks</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-1.5 pr-4 text-left text-gray-400 font-normal">Block</th>
                    <th className="py-1.5 pr-4 text-left text-gray-400 font-normal whitespace-nowrap">Range</th>
                    <th className="py-1.5 text-left text-gray-400 font-normal">Examples</th>
                  </tr>
                </thead>
                <tbody>
                  {UNICODE_BLOCKS.map((b, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-1.5 pr-4 text-gray-300">{b.name}</td>
                      <td className="py-1.5 pr-4 text-gray-400 font-mono whitespace-nowrap">U+{b.start.toString(16).toUpperCase().padStart(4, '0')}–U+{b.end.toString(16).toUpperCase().padStart(4, '0')}</td>
                      <td className="py-1.5 text-gray-300">{b.example}</td>
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
