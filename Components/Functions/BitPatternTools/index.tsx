'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  Meter,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzeBytes, type BitPatternRow, type InputMode } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const TEXT_PRESETS = [
  { label: 'Hello', value: 'Hello' },
  { label: 'Emoji', value: 'héllo 👋' },
  { label: 'Newline', value: 'a\nb' },
];

const HEX_PRESETS = [
  { label: '48 65 6C 6C 6F', value: '48 65 6C 6C 6F' },
  { label: 'FF 00 AA 55', value: 'FF 00 AA 55' },
  { label: '0xDEADBEEF', value: '0xDEADBEEF' },
];

/** The 8 bits of one byte, MSB first — set bits carry the emphasis. */
const BitStrip = ({ binary }: { binary: string }) => (
  <span className="inline-flex gap-px">
    {binary.split('').map((bit, i) => (
      <span
        key={i}
        title={`Bit ${7 - i}`}
        className={`w-4 h-5 flex items-center justify-center font-mono text-[11px] border ${
          bit === '1'
            ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
            : 'bg-white border-gray-200 text-gray-300'
        }`}
      >
        {bit}
      </span>
    ))}
  </span>
);

const ByteRow = ({ row, index }: { row: BitPatternRow; index: number }) => (
  <tr className="border-t border-gray-200 hover:bg-gray-50">
    <td className="px-3 py-1.5 font-mono text-[10px] text-gray-400">{index}</td>
    <td className="px-3 py-1.5 font-mono text-xs text-gray-900 whitespace-nowrap">
      {row.char === '.' ? <span className="text-gray-300">.</span> : row.char}
    </td>
    <td className="px-3 py-1.5">
      <BitStrip binary={row.binary8} />
    </td>
    <td className="px-3 py-1.5 font-mono text-xs text-gray-900 text-right">{row.hex2}</td>
    <td className="px-3 py-1.5 font-mono text-xs text-gray-600 text-right">{row.decimal}</td>
    <td className="px-3 py-1.5 font-mono text-xs text-gray-600 text-right">{row.octal3}</td>
    <td className="px-3 py-1.5 font-mono text-xs text-gray-600 text-right">{row.bitCount}</td>
    <td className="px-3 py-1.5 text-center">
      <StatusBadge tone={row.parity === 'even' ? 'neutral' : 'info'}>{row.parity}</StatusBadge>
    </td>
  </tr>
);

export const BitPatternViewer = () => {
  const [input, setInput] = useState('Hello');
  const [mode, setMode] = useState<InputMode>('text');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '';
    if (from) setInput(from);
    const modeParam = params.get('mode');
    if (modeParam === 'hex' || modeParam === 'text') setMode(modeParam);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input, mode })

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' };
    try {
      return { result: analyzeBytes(input, mode), error: '' };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Parse error' };
    }
  }, [input, mode]);

  const density = result && result.totalBits > 0 ? result.setBitsTotal / result.totalBits : 0;

  /** Bytes that occur more than once, most frequent first. */
  const repeats = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.byteFrequency)
      .map(([byte, count]) => ({ byte: Number(byte), count }))
      .filter(b => b.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [result]);

  return (
    <Panel
      title="Bit Pattern Viewer"
      description="Inspect text or hex data byte by byte. Each byte is shown as an 8-bit strip alongside its hex, decimal, octal, bit count and parity — useful for reading [1 UTF-8 encoding 2], [1 bit manipulation 2] and [1 binary protocols 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-1">
              {(['text', 'hex'] as InputMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-2 text-xs font-bold transition-colors duration-150 cursor-pointer border ${
                    mode === m
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {m === 'text' ? 'Text (UTF-8)' : 'Hex input'}
                </button>
              ))}
            </div>

            <input
              className={inputClass}
              placeholder={mode === 'hex' ? '48 65 6C 6C 6F' : 'Hello'}
              value={input}
              onChange={e => setInput(e.target.value)}
            />

            <PresetRow presets={mode === 'hex' ? HEX_PRESETS : TEXT_PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && result.totalBytes > 0 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label="Bytes"
                  value={result.totalBytes}
                  hint={mode === 'text' ? 'after UTF-8 encoding' : undefined}
                />
                <StatTile label="Total bits" value={result.totalBits} />
                <StatTile
                  label="Set bits"
                  value={<span className="text-emerald-700">{result.setBitsTotal}</span>}
                  hint={`${Math.round(density * 100)}% of all bits`}
                />
                <StatTile label="Clear bits" value={result.clearBitsTotal} />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between font-mono text-[10px] text-gray-500">
                  <span>Bit density</span>
                  <span>{Math.round(density * 100)}% set</span>
                </div>
                <Meter ratio={density} tone="pass" />
              </div>

              {/* Byte table */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="bits run MSB (7) to LSB (0), left to right">Bytes</SectionTitle>
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Char</th>
                        <th className="px-3 py-2 text-left">Binary</th>
                        <th className="px-3 py-2 text-right">Hex</th>
                        <th className="px-3 py-2 text-right">Dec</th>
                        <th className="px-3 py-2 text-right">Oct</th>
                        <th className="px-3 py-2 text-right">Bits</th>
                        <th className="px-3 py-2 text-center">Parity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <ByteRow key={i} row={row} index={i} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Repeated bytes */}
              {repeats.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note={`${repeats.length} byte value${repeats.length === 1 ? '' : 's'} occur more than once`}>
                    Repeated bytes
                  </SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {repeats.map(({ byte, count }) => (
                      <span
                        key={byte}
                        title={`0x${byte.toString(16).toUpperCase().padStart(2, '0')} appears ${count} times`}
                        className="inline-flex items-baseline gap-2 border border-gray-200 px-2 py-1 font-mono text-xs"
                      >
                        <span className="text-gray-900 font-bold">
                          0x{byte.toString(16).toUpperCase().padStart(2, '0')}
                        </span>
                        <span className="text-gray-400">×{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
