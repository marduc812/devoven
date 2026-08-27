'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { kelvinToRgb, rgbToHex, getDescriptor, getSceneDescription, getNearestPreset, getCssFilter, WB_PRESETS } from './logic';

function isLight(r: number, g: number, b: number): boolean {
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export function WhiteBalanceConverter() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const result = useMemo(() => {
    const trimmed = input.trim().replace(/k$/i, '');
    const k = parseInt(trimmed, 10);
    if (isNaN(k) || k < 1000 || k > 12000) return null;
    const rgb = kelvinToRgb(k);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    return {
      k,
      rgb,
      hex,
      descriptor: getDescriptor(k),
      scene: getSceneDescription(k),
      preset: getNearestPreset(k),
      cssFilter: getCssFilter(k),
    };
  }, [input]);

  const kelvin = result?.k ?? 5500;

  return (
    <Panel
      title="White Balance Converter"
      description="Convert a [1 Kelvin temperature 2] (1000K–12000K) to a warm/cool descriptor, approximate RGB color, nearest photography white balance preset, and [1 CSS filter 2] approximation."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input + slider */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Color Temperature (Kelvin)</label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                className="bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-32 flex-shrink-0"
                placeholder="5500"
                min={1000}
                max={12000}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <input
                type="range"
                min={1000}
                max={12000}
                step={100}
                className="flex-1"
                value={isNaN(parseInt(input)) ? 5500 : parseInt(input)}
                onChange={e => setInput(e.target.value)}
              />
              <span className="text-xs font-mono text-gray-500 w-12 text-right flex-shrink-0">{input || '—'}K</span>
            </div>
          </div>

          {result && (
            <>
              {/* Color swatch */}
              <div
                className="h-20 border border-gray-200 flex items-end px-4 pb-3"
                style={{ backgroundColor: result.hex }}
              >
                <span
                  className="text-xl font-black font-mono tracking-widest"
                  style={{ color: isLight(result.rgb.r, result.rgb.g, result.rgb.b) ? '#000' : '#fff' }}
                >
                  {result.k}K — {result.hex}
                </span>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Kelvin</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">{result.k}K</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Approx RGB</p>
                  <p className="text-sm font-black text-gray-900 font-mono">rgb({result.rgb.r}, {result.rgb.g}, {result.rgb.b})</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Nearest Preset</p>
                  <p className="text-sm font-black text-gray-900 leading-tight">{result.preset.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{result.preset.kelvin}K</p>
                </div>
              </div>

              {/* Description */}
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Descriptor', result.descriptor],
                      ['Scene / Lighting', result.scene],
                      ['Preset Description', result.preset.description],
                    ].map(([label, value], i) => (
                      <tr key={label} className={i > 0 ? 'border-t border-gray-200' : ''}>
                        <td className="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider w-36">{label}</td>
                        <td className="px-4 py-2 text-gray-900 text-sm">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* CSS Filter */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">CSS Filter Approximation</p>
                <div
                  className="border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-100"
                  onClick={() => navigator.clipboard.writeText(`filter: ${result.cssFilter};`)}
                  title="Click to copy"
                >
                  filter: {result.cssFilter};
                </div>
              </div>

              {/* Preset reference table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">White Balance Presets</p>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Kelvin', 'Preset', 'Description', 'Color'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {WB_PRESETS.map((p, i) => {
                        const pRgb = kelvinToRgb(p.kelvin);
                        const pHex = rgbToHex(pRgb.r, pRgb.g, pRgb.b);
                        const isNearest = p.name === result.preset.name;
                        return (
                          <tr key={p.name} className={`${i > 0 ? 'border-t border-gray-200' : ''} ${isNearest ? 'bg-indigo-50' : ''}`}>
                            <td className="px-3 py-2 text-xs font-mono text-gray-900">{p.kelvin}K</td>
                            <td className={`px-3 py-2 text-xs font-bold ${isNearest ? 'text-indigo-700' : 'text-gray-700'}`}>
                              {p.name}{isNearest && <span className="ml-2 text-indigo-400">← nearest</span>}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-500">{p.description}</td>
                            <td className="px-3 py-2">
                              <div className="w-8 h-4 border border-gray-200" style={{ backgroundColor: pHex }} title={pHex} />
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

          {!result && (
            <p className="text-gray-400 text-sm text-center py-4">Enter a Kelvin value (1000–12000) or drag the slider</p>
          )}
        </div>
      }
    />
  );
}
