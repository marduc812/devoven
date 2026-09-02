'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { convertCssUnit } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 w-24';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

const UNITS = ['px', 'rem', 'em', 'pt', 'cm', 'mm', 'in', 'vw', 'vh'];

export function CssUnitConverterTool() {
  const [input, setInput] = useState('16');
  const [output, setOutput] = useState('');
  const [fromUnit, setFromUnit] = useState('px');
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [viewportWidth, setViewportWidth] = useState(1920);
  const [viewportHeight, setViewportHeight] = useState(1080);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const unit = params.get('unit');
    if (unit && UNITS.includes(unit)) setFromUnit(unit);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ unit: fromUnit })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const value = parseFloat(input);
    if (isNaN(value)) { setOutput('Enter a valid number'); return; }
    try {
      setOutput(convertCssUnit(value, fromUnit, { baseFontSize, viewportWidth, viewportHeight }));
    } catch (e: unknown) {
      setOutput(e instanceof Error ? e.message : 'Conversion error');
    }
  }, [input, fromUnit, baseFontSize, viewportWidth, viewportHeight]);

  return (
    <AdvancedConverter
      title="CSS Unit Converter"
      description="Convert CSS values between all units: [1 px 2], [1 rem 2], [1 em 2], [1 pt 2], [1 cm 2], [1 mm 2], [1 in 2], [1 vw 2], [1 vh 2]."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Value"
      toTitle="All Units"
      backColor="cyan"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <label className={labelClass}>From</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className={selectClass}
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Base font (px)</label>
            <input
              type="number"
              value={baseFontSize}
              onChange={(e) => setBaseFontSize(Number(e.target.value) || 16)}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Viewport W</label>
            <input
              type="number"
              value={viewportWidth}
              onChange={(e) => setViewportWidth(Number(e.target.value) || 1920)}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Viewport H</label>
            <input
              type="number"
              value={viewportHeight}
              onChange={(e) => setViewportHeight(Number(e.target.value) || 1080)}
              className={inputClass}
            />
          </div>
        </div>
      }
    />
  );
}
