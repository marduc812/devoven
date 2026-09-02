'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { simulateAll, parseHex, rgbToHex, ColorblindResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const ColorblindSimulator = () => {
  const [hexInput, setHexInput] = useState('#3b82f6');
  const [results, setResults] = useState<ColorblindResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setHexInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: hexInput })

  useEffect(() => {
    if (!hexInput.trim()) {
      setResults([]);
      setError('');
      return;
    }
    try {
      const r = simulateAll(hexInput);
      setResults(r);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid color');
      setResults([]);
    }
  }, [hexInput]);

  const inputClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';

  let originalHex = '#000000';
  try {
    originalHex = rgbToHex(parseHex(hexInput));
  } catch (_) {
    // ignore
  }

  return (
    <Panel
      title="Colorblind Simulator"
      description="Simulate how a hex color appears to people with different types of color blindness: Protanopia (red-blind), Deuteranopia (green-blind), Tritanopia (blue-blind), and Achromatopsia (complete). Enter a hex color like [1 #3b82f6 2] or [1 #ff0000 2]."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-gray-400 text-xs uppercase tracking-wider">Hex Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={originalHex}
                onChange={e => setHexInput(e.target.value)}
                className="w-12 h-10 border border-gray-200 bg-white cursor-pointer p-1"
                title="Pick a color"
              />
              <input
                type="text"
                className={inputClass}
                placeholder="#3b82f6"
                value={hexInput}
                onChange={e => setHexInput(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {results.length > 0 && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-xs uppercase tracking-wider">Original Color</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 border border-gray-400 flex-shrink-0"
                    style={{ backgroundColor: originalHex }}
                    title={originalHex}
                  />
                  <div>
                    <div className="text-gray-900 font-mono text-sm">{originalHex.toUpperCase()}</div>
                    <div className="text-gray-500 text-xs">Original</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {results.map(r => (
                  <div key={r.type} className="bg-gray-50 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 border border-gray-400 flex-shrink-0"
                        style={{ backgroundColor: r.simulatedHex }}
                        title={r.simulatedHex}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900 font-semibold text-sm">{r.type}</span>
                          <span className="text-gray-500 text-xs font-mono">{r.simulatedHex.toUpperCase()}</span>
                        </div>
                        <div className="text-gray-500 text-xs">
                          Affects: {r.affectedPopulation}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">{r.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
