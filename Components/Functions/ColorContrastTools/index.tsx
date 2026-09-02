'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { checkContrast, WcagResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

function PassBadge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 border ${pass ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{label}</span>
      <span className={`text-xs font-black uppercase tracking-widest ${pass ? 'text-emerald-700' : 'text-red-700'}`}>
        {pass ? 'PASS' : 'FAIL'}
      </span>
    </div>
  );
}

const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';

export const ColorContrastChecker = () => {
  const [color1, setColor1] = useState('');
  const [color2, setColor2] = useState('');
  const [result, setResult] = useState<WcagResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from') || '';
    if (from) {
      const lines = from.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines[0]) setColor1(lines[0]);
      if (lines[1]) setColor2(lines[1]);
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: [color1, color2].filter(Boolean).join('\n') })

  useEffect(() => {
    if (!color1.trim() || !color2.trim()) { setResult(null); setError(''); return; }
    try {
      setResult(checkContrast(color1.trim(), color2.trim()));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      setResult(null);
    }
  }, [color1, color2]);

  const toHex = (c: string) => c.startsWith('#') ? c : '#' + c;
  const c1hex = toHex(color1.trim() || 'ffffff');
  const c2hex = toHex(color2.trim() || '000000');

  const ratioColor = result
    ? result.ratio >= 7 ? 'text-emerald-700' : result.ratio >= 4.5 ? 'text-green-700' : result.ratio >= 3 ? 'text-yellow-700' : 'text-red-700'
    : 'text-gray-400';

  return (
    <Panel
      title="Color Contrast Checker"
      description="Check [1 WCAG 2.1 2] contrast ratio between two colors. Shows AA and AAA pass/fail for normal and large text."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Foreground Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color1.startsWith('#') ? color1 : '#' + color1.replace(/[^0-9a-fA-F]/g, '')} onChange={e => setColor1(e.target.value)} className="w-9 h-9 border border-gray-300 cursor-pointer p-0.5 bg-white flex-shrink-0" />
                <input type="text" className={inputClass} placeholder="#000000" value={color1} onChange={e => setColor1(e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Background Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color2.startsWith('#') ? color2 : '#' + color2.replace(/[^0-9a-fA-F]/g, '')} onChange={e => setColor2(e.target.value)} className="w-9 h-9 border border-gray-300 cursor-pointer p-0.5 bg-white flex-shrink-0" />
                <input type="text" className={inputClass} placeholder="#ffffff" value={color2} onChange={e => setColor2(e.target.value)} />
              </div>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          {color1 && color2 && (
            <div className="border border-gray-200 overflow-hidden">
              <div className="px-4 py-6 flex flex-col gap-1" style={{ backgroundColor: c2hex }}>
                <span className="text-xl font-black" style={{ color: c1hex }}>The quick brown fox</span>
                <span className="text-sm" style={{ color: c1hex }}>Normal text sample at 16px</span>
                <span className="text-xs" style={{ color: c1hex }}>Small text sample at 12px</span>
              </div>
            </div>
          )}

          {result && (
            <>
              <div className="border-t border-gray-200 pt-4 flex items-baseline gap-3">
                <span className={`text-5xl font-black font-mono ${ratioColor}`}>{result.ratioFormatted}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Contrast Ratio</span>
              </div>

              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 text-gray-500 text-xs">Foreground luminance</td>
                      <td className="px-4 py-2 text-gray-900 font-mono text-right">{result.luminance1.toFixed(4)}</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="px-4 py-2 text-gray-500 text-xs">Background luminance</td>
                      <td className="px-4 py-2 text-gray-900 font-mono text-right">{result.luminance2.toFixed(4)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">WCAG 2.1 Compliance</p>
                <div className="grid grid-cols-2 gap-1">
                  <PassBadge pass={result.normalAA}  label="Normal Text AA (4.5:1)" />
                  <PassBadge pass={result.normalAAA} label="Normal Text AAA (7.0:1)" />
                  <PassBadge pass={result.largeAA}   label="Large Text AA (3.0:1)" />
                  <PassBadge pass={result.largeAAA}  label="Large Text AAA (4.5:1)" />
                </div>
                <p className="text-xs text-gray-400 mt-2">Large text = 18pt normal or 14pt bold (≈24px or 18.67px bold)</p>
              </div>
            </>
          )}

          {!color1 && !color2 && (
            <p className="text-gray-400 text-sm text-center py-4">Enter two hex colors above to check contrast</p>
          )}
        </div>
      }
    />
  );
};
