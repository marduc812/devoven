'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  simplifyRatio,
  ratioToDimensions,
  commonAspectRatios,
  generateFakeData,
  generateShades,
  hexToHsl2,
  type FakeDataType,
} from './logic';

// ─── C2. Fake Data Generator ──────────────────────────────────────────────────

const FAKE_DATA_TYPES: { value: FakeDataType; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'address', label: 'Address' },
  { value: 'uuid', label: 'UUID' },
  { value: 'ipv4', label: 'IPv4' },
  { value: 'date', label: 'Date' },
  { value: 'company', label: 'Company' },
  { value: 'url', label: 'URL' },
  { value: 'hex-color', label: 'Hex Color' },
];

export const FakeDataGenerator = () => {
  const [type, setType] = useState<FakeDataType>('name');
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState('');

  const generate = () => {
    setOutput(generateFakeData(type, Math.max(1, Math.min(100, count))));
  };

  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 font-mono text-sm';
  const btnClass = 'px-4 py-2 border border-gray-900 bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors duration-200 cursor-pointer';

  return (
    <Panel
      title="Fake Data Generator"
      description="Generate realistic-looking test data. Choose a type like [1 email 2] or [1 address 2], set the count, and click Generate."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Data type</label>
              <select
                className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 w-full"
                value={type}
                onChange={e => setType(e.target.value as FakeDataType)}
              >
                {FAKE_DATA_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Count (1–100)</label>
              <input
                className={`${inputClass} w-full`}
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
              />
            </div>
          </div>
          <button className={btnClass} onClick={generate}>Generate</button>
          {output && (
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 font-mono text-sm resize-y"
              rows={10}
              value={output}
              readOnly
            />
          )}
        </div>
      }
    />
  );
};

// ─── C3. Color Shades Generator ───────────────────────────────────────────────

export const ColorShadesGenerator = () => {
  const [hex, setHex] = useState('#3B82F6');
  const [copied, setCopied] = useState<string | null>(null);

  let shades: { shade: number; hex: string; hsl: string }[] = [];
  try {
    shades = generateShades(hex);
  } catch { /* ignore invalid input */ }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 font-mono text-sm';

  return (
    <Panel
      title="Color Shades Generator"
      description="Generate a Tailwind-style palette of 10 light-to-dark shades from any hex color. Enter a color like [1 #3B82F6 2] to see shades from 50 to 950."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-3 items-center">
            <input
              type="color"
              value={hex.length === 7 && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#3B82F6'}
              onChange={e => setHex(e.target.value.toUpperCase())}
              className="h-10 w-10 border border-gray-200 cursor-pointer bg-transparent"
            />
            <input
              className={`${inputClass} flex-1`}
              value={hex}
              onChange={e => setHex(e.target.value.toUpperCase())}
              placeholder="#3B82F6"
              maxLength={7}
            />
          </div>
          {shades.length > 0 && (
            <div className="flex flex-col gap-1">
              {shades.map(shade => (
                <div key={shade.shade} className="flex flex-row items-center gap-3 overflow-hidden">
                  <div
                    className="w-10 h-10 flex-shrink-0 border border-gray-200"
                    style={{ backgroundColor: shade.hex }}
                  />
                  <span className="text-gray-400 text-xs w-10">{shade.shade}</span>
                  <span className="text-gray-900 font-mono text-xs flex-1">{shade.hex}</span>
                  <span className="text-gray-400 font-mono text-xs hidden sm:block flex-1">{shade.hsl}</span>
                  <button
                    className="text-xs text-gray-400 hover:text-gray-900 transition-colors duration-200 font-mono px-2 py-1 rounded border border-gray-200 hover:border-gray-400"
                    onClick={() => copyToClipboard(shade.hex)}
                  >
                    {copied === shade.hex ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
};
