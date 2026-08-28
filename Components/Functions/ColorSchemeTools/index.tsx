'use client';

import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';

function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0, sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
  }
  return [Math.round(hue * 360), Math.round(sat * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100, ll = l / 100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = ll - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0').toUpperCase();
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function isLight(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function SchemeRow({ name, colors }: { name: string; colors: string[] }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{name}</p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${colors.length}, minmax(0, 1fr))` }}>
        {colors.map((hex, i) => {
          const light = isLight(hex);
          return (
            <div
              key={i}
              className="group cursor-pointer"
              onClick={() => copy(hex)}
              title={`Copy ${hex}`}
            >
              <div
                className="h-12 border border-gray-200 group-hover:border-gray-500 transition-colors duration-100 flex items-center justify-center"
                style={{ backgroundColor: hex }}
              >
                <span
                  className="text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-100"
                  style={{ color: light ? '#000' : '#fff' }}
                >
                  copy
                </span>
              </div>
              <p className="text-xs font-mono text-gray-500 mt-1 text-center">{hex}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ColorSchemeGenerator() {
  const [input, setInput] = useState('#3B82F6');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  const schemes = useMemo(() => {
    const h = input.replace('#', '');
    if (!/^[0-9A-Fa-f]{6}$/.test(h)) return null;
    const [hue, sat, lig] = hexToHsl('#' + h);
    return {
      base: '#' + h.toUpperCase(),
      hsl: [hue, sat, lig] as [number, number, number],
      sections: [
        { name: 'Complementary', colors: [hslToHex(hue, sat, lig), hslToHex((hue + 180) % 360, sat, lig)] },
        { name: 'Analogous', colors: [hslToHex((hue - 30 + 360) % 360, sat, lig), hslToHex(hue, sat, lig), hslToHex((hue + 30) % 360, sat, lig)] },
        { name: 'Triadic', colors: [hslToHex(hue, sat, lig), hslToHex((hue + 120) % 360, sat, lig), hslToHex((hue + 240) % 360, sat, lig)] },
        { name: 'Split-Complementary', colors: [hslToHex(hue, sat, lig), hslToHex((hue + 150) % 360, sat, lig), hslToHex((hue + 210) % 360, sat, lig)] },
        { name: 'Tetradic', colors: [hslToHex(hue, sat, lig), hslToHex((hue + 90) % 360, sat, lig), hslToHex((hue + 180) % 360, sat, lig), hslToHex((hue + 270) % 360, sat, lig)] },
        { name: 'Monochromatic', colors: [
          hslToHex(hue, sat, Math.max(0, lig - 30)),
          hslToHex(hue, sat, Math.max(0, lig - 15)),
          hslToHex(hue, sat, lig),
          hslToHex(hue, sat, Math.min(100, lig + 15)),
          hslToHex(hue, sat, Math.min(100, lig + 30)),
        ]},
      ],
    };
  }, [input]);

  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(input) ? input : '#3b82f6';

  return (
    <Panel
      title="Color Scheme Generator"
      description="Generate color schemes from a [1 hex color 2]: [1 complementary 2], [1 analogous 2], [1 triadic 2], [1 tetradic 2], [1 split-complementary 2], and [1 monochromatic 2] palettes. Click any swatch to copy its hex."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Base Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={pickerValue}
                onChange={e => setInput(e.target.value)}
                className="w-9 h-9 border border-gray-300 cursor-pointer p-0.5 bg-white flex-shrink-0"
              />
              <input
                type="text"
                className="bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full"
                placeholder="#3B82F6"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </div>
          </div>

          {schemes ? (
            <>
              {/* Base info */}
              <div className="flex items-center gap-3 border border-gray-200 p-3">
                <div className="w-10 h-10 border border-gray-200 flex-shrink-0" style={{ backgroundColor: schemes.base }} />
                <div>
                  <p className="text-xs font-bold text-gray-900 font-mono">{schemes.base}</p>
                  <p className="text-xs text-gray-500">hsl({schemes.hsl[0]}, {schemes.hsl[1]}%, {schemes.hsl[2]}%)</p>
                </div>
              </div>

              {/* Scheme sections */}
              {schemes.sections.map(s => (
                <SchemeRow key={s.name} name={s.name} colors={s.colors} />
              ))}
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">Enter a valid 6-digit hex color above</p>
          )}
        </div>
      }
    />
  );
}
