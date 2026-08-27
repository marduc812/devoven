'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  MAX_DISTANCE,
  TAILWIND_COLORS,
  familyShades,
  findClosestTailwindColors,
  hexToRgb,
  normalizeHex,
} from './logic';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) < 150;
}

/** How close a match is, in words, on the Euclidean RGB scale. */
function verdict(distance: number): string {
  if (distance === 0) return 'exact match';
  if (distance < 10) return 'indistinguishable by eye';
  if (distance < 25) return 'very close';
  if (distance < 50) return 'close enough for most UI work';
  if (distance < 100) return 'visibly different';
  return 'nothing in the palette is near this';
}

const PREFIXES = ['bg', 'text', 'border', 'ring'];

export function TailwindColorTools() {
  const [hexInput, setHexInput] = useState('#3b82f6');

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from');
    if (from) setHexInput(from.trim());
  }, []);

  const result = useMemo(() => {
    if (!hexInput.trim()) return { data: null, error: 'Enter a hex colour, for example #3b82f6' };
    try {
      const hex = normalizeHex(hexInput);
      const matches = findClosestTailwindColors(hex, 6);
      const best = matches[0];
      const family = best.name.includes('-') ? best.name.split('-')[0] : null;
      return {
        data: { hex, rgb: hexToRgb(hex), matches, best, family, shades: family ? familyShades(family) : [] },
        error: null as string | null,
      };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Could not read that colour' };
    }
  }, [hexInput]);

  const data = result.data;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  return (
    <Panel
      title="Tailwind Color Finder"
      description="Paste any [1 hex colour 2] to find the nearest colours in the Tailwind CSS v3 palette, ranked by [1 Euclidean RGB distance 2] across all 242 defaults. Shows how far off each match is, the class names to paste, and where the winner sits in its family ramp."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={`${labelClass} block mb-1`}>Hex Colour</label>
              <input
                className={inputClass}
                placeholder="#3b82f6"
                value={hexInput}
                onChange={e => setHexInput(e.target.value)}
                aria-label="Hex colour"
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Pick</label>
              <input
                type="color"
                value={data ? data.hex : '#3b82f6'}
                onChange={e => setHexInput(e.target.value)}
                className="w-full h-[38px] border border-gray-300 bg-white p-1 cursor-pointer"
                aria-label="Colour picker"
              />
            </div>
          </div>

          {result.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">
              {result.error}
            </div>
          )}

          {data && (
            <>
              {/* Yours vs the nearest Tailwind colour */}
              <div className="grid grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                <div className="p-6 flex flex-col justify-between min-h-[140px]" style={{ background: data.hex }}>
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${isDark(data.hex) ? 'text-gray-200' : 'text-gray-700'}`}
                  >
                    Your colour
                  </p>
                  <div>
                    <p className={`text-xl font-black font-mono ${isDark(data.hex) ? 'text-white' : 'text-gray-900'}`}>
                      {data.hex}
                    </p>
                    <p className={`text-xs font-mono ${isDark(data.hex) ? 'text-gray-300' : 'text-gray-600'}`}>
                      rgb({data.rgb.join(', ')})
                    </p>
                  </div>
                </div>
                <div
                  className="p-6 flex flex-col justify-between min-h-[140px]"
                  style={{ background: data.best.hex }}
                >
                  <p
                    className={`text-[10px] font-bold uppercase tracking-widest ${isDark(data.best.hex) ? 'text-gray-200' : 'text-gray-700'}`}
                  >
                    Nearest Tailwind
                  </p>
                  <div>
                    <p
                      className={`text-xl font-black font-mono ${isDark(data.best.hex) ? 'text-white' : 'text-gray-900'}`}
                    >
                      {data.best.name}
                    </p>
                    <p className={`text-xs font-mono ${isDark(data.best.hex) ? 'text-gray-300' : 'text-gray-600'}`}>
                      {data.best.hex} · Δ {data.best.distance.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 px-6 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">Verdict</p>
                <p className="text-2xl font-black text-white leading-tight">{verdict(data.best.distance)}</p>
                <p className="text-sm text-gray-300 mt-1 font-mono">
                  Δ {data.best.distance.toFixed(2)} of {MAX_DISTANCE.toFixed(0)} possible
                </p>
              </div>

              {/* Class names to paste */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Classes <span className="normal-case font-normal text-gray-400">(click to copy)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {PREFIXES.map(prefix => (
                    <button
                      key={prefix}
                      onClick={() => copy(`${prefix}-${data.best.name}`)}
                      className="font-mono text-sm px-3 py-1.5 border border-gray-300 bg-white text-gray-900 hover:border-gray-900 hover:bg-gray-50"
                    >
                      {prefix}-{data.best.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ranked matches */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Closest Matches{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (shorter bar = closer to your colour)
                  </span>
                </p>
                <div className="border border-gray-200 divide-y divide-gray-100">
                  {data.matches.map((m, i) => (
                    <button
                      key={m.name}
                      onClick={() => copy(m.name)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                      title={`Copy ${m.name}`}
                    >
                      <span className="font-mono text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
                      <span
                        className="w-8 h-8 flex-shrink-0 border border-gray-300"
                        style={{ background: m.hex }}
                      />
                      <span className="font-mono text-sm text-gray-900 w-32 flex-shrink-0 truncate">{m.name}</span>
                      <span className="font-mono text-xs text-gray-400 w-20 flex-shrink-0 hidden sm:block">
                        {m.hex}
                      </span>
                      <span className="flex-1 h-2 bg-gray-100 min-w-0">
                        <span
                          className="block h-2 bg-gray-900"
                          style={{ width: `${Math.min(100, (m.distance / 120) * 100)}%` }}
                        />
                      </span>
                      <span className="font-mono text-xs text-gray-500 w-14 text-right flex-shrink-0">
                        Δ{m.distance.toFixed(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Family ramp */}
              {data.family && (
                <div>
                  <p className={`${labelClass} mb-2`}>
                    The {data.family} Ramp{' '}
                    <span className="normal-case font-normal text-gray-400">
                      (your match is outlined — a neighbouring shade may suit better)
                    </span>
                  </p>
                  <div className="flex flex-wrap sm:flex-nowrap gap-px bg-gray-200 border border-gray-200">
                    {data.shades.map(shade => {
                      const active = shade.name === data.best.name;
                      return (
                        <button
                          key={shade.name}
                          onClick={() => setHexInput(shade.hex)}
                          title={`${shade.name} · ${shade.hex}`}
                          className="flex-1 min-w-[52px] flex flex-col items-stretch"
                        >
                          <span
                            className={`h-14 block ${active ? 'ring-2 ring-inset ring-gray-900' : ''}`}
                            style={{ background: shade.hex }}
                          />
                          <span
                            className={`text-[10px] font-mono py-1 text-center ${active ? 'bg-gray-900 text-white font-bold' : 'bg-white text-gray-500'}`}
                          >
                            {shade.name.split('-')[1]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 font-mono">
                Searched {TAILWIND_COLORS.length} palette entries. Distance is straight-line in RGB space, so it
                ranks by pixel value rather than by perceived difference.
              </p>
            </>
          )}
        </div>
      }
    />
  );
}
