'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calculateFluidType, getFluidTypePresets } from './logic';

export function FluidTypeCalculator() {
  const [minFont, setMinFont] = useState('16');
  const [maxFont, setMaxFont] = useState('24');
  const [minVp, setMinVp] = useState('320');
  const [maxVp, setMaxVp] = useState('1440');
  const [output, setOutput] = useState('');
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState('');

  const presets = getFluidTypePresets();

  useEffect(() => {
    setError('');
    const minF = parseFloat(minFont);
    const maxF = parseFloat(maxFont);
    const minV = parseFloat(minVp);
    const maxV = parseFloat(maxVp);
    if (isNaN(minF) || isNaN(maxF) || isNaN(minV) || isNaN(maxV)) {
      setOutput(''); setSteps([]); return;
    }
    try {
      const result = calculateFluidType({ minFontPx: minF, maxFontPx: maxF, minViewportPx: minV, maxViewportPx: maxV });
      setOutput(result.cssRule);
      setSteps(result.steps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      setOutput(''); setSteps([]);
    }
  }, [minFont, maxFont, minVp, maxVp]);

  const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 font-mono w-full';
  const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
  const btnClass = 'px-3 py-1.5 text-xs border border-gray-200 bg-gray-50 text-gray-300 hover:text-gray-900 hover:border-gray-400 transition-colors cursor-pointer';

  return (
    <Panel
      title="Fluid Typography Calculator"
      description="Generate CSS [1 clamp() 2] values for fluid typography that scales smoothly between viewport sizes."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Presets */}
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Presets</span>
            <div className="flex flex-wrap gap-2">
              {presets.map(function(p) {
                return (
                  <button
                    key={p.name}
                    className={btnClass}
                    onClick={function() { setMinFont(String(p.minFontPx)); setMaxFont(String(p.maxFontPx)); }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Min Font Size (px)</span>
              <input type="number" className={inputClass} value={minFont} min={1} onChange={function(e) { setMinFont(e.target.value); }} />
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Max Font Size (px)</span>
              <input type="number" className={inputClass} value={maxFont} min={1} onChange={function(e) { setMaxFont(e.target.value); }} />
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Min Viewport (px)</span>
              <input type="number" className={inputClass} value={minVp} min={1} onChange={function(e) { setMinVp(e.target.value); }} />
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Max Viewport (px)</span>
              <input type="number" className={inputClass} value={maxVp} min={1} onChange={function(e) { setMaxVp(e.target.value); }} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 px-3 py-2">
              {error}
            </div>
          )}

          {/* Result */}
          {output && (
            <>
              <div className="w-full h-px bg-gray-200" />
              <div className="flex flex-col gap-2">
                <span className={labelClass}>Generated CSS</span>
                <pre className="bg-gray-50 text-indigo-200 p-3 border border-gray-200 font-mono text-sm overflow-x-auto">
                  {output}
                </pre>
              </div>

              {steps.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className={labelClass}>Calculation Steps</span>
                  <pre className="bg-gray-50 text-gray-400 p-3 border border-gray-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {steps.join('\n')}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
