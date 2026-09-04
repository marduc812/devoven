'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeColor } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function Swatch({ hex, label, onClick }: { hex: string; label?: string; onClick?: () => void }) {
  const light = isLight(hex);
  return (
    <div
      className={`flex flex-col items-center cursor-pointer group ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      title={onClick ? `Copy ${hex}` : hex}
    >
      <div
        className="w-full h-10 border border-gray-200 group-hover:border-gray-500 transition-colors duration-100 flex items-center justify-center"
        style={{ backgroundColor: hex }}
      >
        {onClick && (
          <span className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-100" style={{ color: light ? '#000' : '#fff' }}>
            copy
          </span>
        )}
      </div>
      <span className="text-xs font-mono text-gray-500 mt-1">{label ?? hex.toUpperCase()}</span>
    </div>
  );
}

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export const ColorPickerHelper = () => {
  const [hex, setHex] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from') || '';
    if (from) setHex(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: hex })

  const analysis = useMemo(() => {
    if (!hex.trim()) return null;
    try { return analyzeColor(hex.trim()); } catch { return null; }
  }, [hex]);

  const colorHex = analysis?.hex ?? (hex.startsWith('#') ? hex : '#' + hex.replace(/[^0-9a-fA-F]/g, ''));
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(colorHex) ? colorHex : '#3b82f6';

  return (
    <Panel
      title="Color Picker Helper"
      description="Enter a [1 hex color 2] to get RGB, HSL, HSV, CMYK, complementary, shades, tints, and CSS variables. Try [1 #3b82f6 2] or [1 #10b981 2]."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input */}
          <div>
            <label className={labelClass}>Hex Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={pickerValue}
                onChange={e => setHex(e.target.value)}
                className="w-9 h-9 border border-gray-300 cursor-pointer p-0.5 bg-white flex-shrink-0"
              />
              <input
                type="text"
                className="bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full"
                placeholder="#3b82f6"
                value={hex}
                onChange={e => setHex(e.target.value)}
              />
            </div>
          </div>

          {analysis && (
            <>
              {/* Main swatch */}
              <div
                className="h-24 border border-gray-200 flex items-end px-4 pb-3"
                style={{ backgroundColor: analysis.hex }}
              >
                <span
                  className="text-2xl font-black font-mono tracking-widest"
                  style={{ color: isLight(analysis.hex) ? '#000000' : '#ffffff' }}
                >
                  {analysis.hex.toUpperCase()}
                </span>
              </div>

              {/* Color values table */}
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['HEX', analysis.hex.toUpperCase()],
                      ['RGB', `rgb(${analysis.rgb.r}, ${analysis.rgb.g}, ${analysis.rgb.b})`],
                      ['HSL', `hsl(${analysis.hsl.h}deg, ${analysis.hsl.s}%, ${analysis.hsl.l}%)`],
                      ['HSV', `hsv(${analysis.hsv.h}deg, ${analysis.hsv.s}%, ${analysis.hsv.v}%)`],
                      ['CMYK', `cmyk(${analysis.cmyk.c}%, ${analysis.cmyk.m}%, ${analysis.cmyk.y}%, ${analysis.cmyk.k}%)`],
                      ['Tailwind', analysis.tailwindHint],
                    ].map(([label, value], i) => (
                      <tr
                        key={label}
                        className={`cursor-pointer hover:bg-gray-50 ${i > 0 ? 'border-t border-gray-200' : ''}`}
                        onClick={() => copy(value)}
                        title={`Copy ${value}`}
                      >
                        <td className="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider w-16">{label}</td>
                        <td className="px-4 py-2 text-gray-900 font-mono text-xs">{value}</td>
                        <td className="px-4 py-2 text-gray-400 text-xs text-right">copy</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Complementary */}
              <div>
                <p className={labelClass}>Complementary Color</p>
                <div className="grid grid-cols-2 gap-2">
                  <Swatch hex={analysis.hex} label="Base" onClick={() => copy(analysis.hex)} />
                  <Swatch hex={analysis.complementary} label="Complement" onClick={() => copy(analysis.complementary)} />
                </div>
              </div>

              {/* Shades */}
              <div>
                <p className={labelClass}>Darker Shades</p>
                <div className="grid grid-cols-5 gap-1">
                  {analysis.shades.map((s, i) => (
                    <Swatch key={i} hex={s} onClick={() => copy(s)} />
                  ))}
                </div>
              </div>

              {/* Tints */}
              <div>
                <p className={labelClass}>Lighter Tints</p>
                <div className="grid grid-cols-5 gap-1">
                  {analysis.tints.map((t, i) => (
                    <Swatch key={i} hex={t} onClick={() => copy(t)} />
                  ))}
                </div>
              </div>

              {/* CSS Variables */}
              <div>
                <p className={labelClass}>CSS Variables</p>
                <div
                  className="border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors duration-100"
                  onClick={() => copy(analysis.cssVariable)}
                  title="Click to copy"
                >
                  <pre className="whitespace-pre-wrap">{analysis.cssVariable}</pre>
                </div>
              </div>
            </>
          )}

          {!hex.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Enter a hex color above to analyze</p>
          )}
        </div>
      }
    />
  );
};
