'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { textToCharBinaries, autoConvert } from './logic';

export const BinaryVisual = () => {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  const { direction, output } = autoConvert(input);
  const charBinaries = direction === 'encode' && input.trim() ? textToCharBinaries(input.slice(0, 64)) : [];

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 text-sm font-mono';

  return (
    <Panel
      title="Binary Visual"
      description="Enter text to see each character as an [1 8-bit binary 2] pattern, or enter binary digits to decode back to text. Auto-detects direction."
      backColor="yellow"
      extraElements={
        <div className="flex flex-col gap-4 w-full">
          <div>
            <p className="text-gray-400 text-xs mb-1">
              {direction === 'encode' ? 'Text → Binary' : 'Binary → Text'}
            </p>
            <textarea
              className={inputClass}
              placeholder="Type text or paste binary (e.g. 01001000 01101001)"
              value={input}
              rows={3}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {/* Visual bit grid for text input */}
          {charBinaries.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Bit Pattern (MSB first)</p>
              <div className="flex flex-wrap gap-3">
                {charBinaries.map((cb, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-gray-900 text-sm font-mono">
                      {cb.code < 32 ? '·' : cb.char}
                    </span>
                    <div className="flex gap-0.5">
                      {cb.bits.map((bit, j) => (
                        <div
                          key={j}
                          className={`w-5 h-5 rounded-sm text-xs flex items-center justify-center font-mono ${bit ? 'bg-yellow-500/40 text-yellow-200' : 'bg-white/5 text-gray-600'}`}
                        >
                          {bit ? '1' : '0'}
                        </div>
                      ))}
                    </div>
                    <span className="text-gray-500 text-xs">{cb.code}</span>
                  </div>
                ))}
                {input.length > 64 && (
                  <p className="text-gray-500 text-xs self-end">
                    (showing first 64 chars)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Text output */}
          {output && (
            <div>
              <p className="text-gray-400 text-xs mb-1">Output</p>
              <textarea
                className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
                rows={8}
                value={output}
                readOnly
              />
            </div>
          )}
        </div>
      }
    />
  );
};
