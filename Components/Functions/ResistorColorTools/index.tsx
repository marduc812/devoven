'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { decodeColorBands, resistanceToBands4, findESeries } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const COLOR_HEX: Record<string, string> = {
  black: '#1a1a1a', brown: '#8B4513', red: '#CC0000', orange: '#FF8C00',
  yellow: '#FFD700', green: '#228B22', blue: '#0055CC', violet: '#8B00FF',
  grey: '#808080', white: '#F5F5F5', gold: '#DAA520', silver: '#C0C0C0',
};

type Mode = 'decode' | 'encode';

export const ResistorColorDecoder = () => {
  const [mode, setMode] = useState<Mode>('decode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [bands, setBands] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); setBands([]); return; }

    if (mode === 'decode') {
      try {
        const result = decodeColorBands(input);
        const lines = [
          `Resistance:  ${result.formatted}  (${result.resistance} Ω)`,
          `Tolerance:   ${result.tolerance}`,
          `E-Series:    ${result.eSeries}`,
        ];
        setOutput(lines.join('\n'));
        setBands(result.bands);
        setError('');
      } catch (e) {
        setOutput('');
        setError(e instanceof Error ? e.message : 'Invalid input');
        setBands([]);
      }
    } else {
      // encode mode — parse resistance value
      try {
        const ohmsStr = input.trim().toLowerCase()
          .replace(/kohm|kΩ|kΩ|k/, 'e3')
          .replace(/mohm|mΩ|mΩ|m(?=\d)/, 'e6')
          .replace(/[Ωohm\s]/g, '');
        const ohms = parseFloat(ohmsStr);
        if (isNaN(ohms) || ohms <= 0) throw new Error('Enter a resistance value like "4700", "4.7k", or "10kΩ"');

        const colorBands = resistanceToBands4(ohms);
        const eSeries = findESeries(ohms);

        if (!colorBands) {
          setOutput(`E-Series: ${eSeries}\n(Value outside 4-band representable range)`);
          setBands([]);
        } else {
          setOutput(`Bands (4-band): ${colorBands.join(', ')}\nE-Series: ${eSeries}`);
          setBands(colorBands);
        }
        setError('');
      } catch (e) {
        setOutput('');
        setError(e instanceof Error ? e.message : 'Invalid resistance value');
        setBands([]);
      }
    }
  }, [input, mode]);

  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';
  const btnBase = 'px-4 py-2 text-sm font-semibold transition-colors duration-150';
  const btnActive = 'bg-emerald-700 text-white';
  const btnInactive = 'bg-white text-gray-400 hover:text-gray-900 border border-gray-200';

  return (
    <Panel
      title="Resistor Color Code"
      description="Decode [1 4-band and 5-band resistor color codes 2] to resistance values, or find the color bands for a given resistance. Includes [1 E12, E24, E96 2] standard series lookup."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button className={`${btnBase} ${mode === 'decode' ? btnActive : btnInactive}`} onClick={() => { setMode('decode'); setInput(''); setOutput(''); setBands([]); }}>
              Colors → Value
            </button>
            <button className={`${btnBase} ${mode === 'encode' ? btnActive : btnInactive}`} onClick={() => { setMode('encode'); setInput(''); setOutput(''); setBands([]); }}>
              Value → Colors
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {mode === 'decode' ? 'Color bands (comma-separated)' : 'Resistance value'}
            </label>
            <input
              type="text"
              className={textareaClass}
              placeholder={mode === 'decode' ? 'red, red, brown, gold' : '4700 or 4.7k or 10kΩ'}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

          {bands.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Color Bands</label>
              <div className="flex gap-2 items-end">
                {bands.map((color, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-14 rounded border border-gray-400"
                      style={{ backgroundColor: COLOR_HEX[color] || '#888' }}
                    />
                    <span className="text-gray-400 text-xs whitespace-nowrap">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {output && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Result</label>
              <pre className="bg-gray-50 p-3 border border-gray-200 font-mono text-sm text-gray-900 whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}

          <div className="w-full h-px bg-gray-200" />
          <div className="text-gray-500 text-xs font-mono space-y-1">
            <p>4-band: digit · digit · multiplier · tolerance</p>
            <p>5-band: digit · digit · digit · multiplier · tolerance</p>
            <p>Colors: black brown red orange yellow green blue violet grey white · gold silver</p>
          </div>
        </div>
      }
    />
  );
};
