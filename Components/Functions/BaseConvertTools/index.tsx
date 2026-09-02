'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  COMMON_BASES,
  MAX_BASE,
  MIN_BASE,
  allBases,
  bitLength,
  convertBases,
  digitSet,
  placeValues,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/** Break a long digit string into groups so the eye can follow it. */
function group(value: string, base: number): string {
  const size = base === 2 ? 4 : base === 16 ? 2 : 3;
  const negative = value.startsWith('-');
  const digits = negative ? value.slice(1) : value;
  if (digits.length <= size) return value;

  const parts: string[] = [];
  for (let end = digits.length; end > 0; end -= size) {
    parts.unshift(digits.slice(Math.max(0, end - size), end));
  }
  return (negative ? '-' : '') + parts.join(' ');
}

function BaseCard({ base, label, value }: { base: number; label: string; value: string }) {
  const digitCount = value.replace('-', '').length;
  return (
    <button
      onClick={() => copy(value)}
      title="Click to copy"
      className="bg-white p-4 text-left hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className={labelClass}>{label}</span>
        <span className="text-[10px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          copy
        </span>
      </div>
      <p className="text-lg font-mono font-bold text-gray-900 break-all leading-snug">
        {group(value, base)}
      </p>
      <p className="text-[10px] text-gray-400 mt-1 font-mono">
        {digitCount} digit{digitCount === 1 ? '' : 's'}
      </p>
    </button>
  );
}

export function BaseConverter() {
  const [input, setInput] = useState('255');
  const [sourceBase, setSourceBase] = useState(10);

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) setInput(from);
    const base = p.get('base');
    if (base) {
      const b = parseInt(base);
      if (b >= MIN_BASE && b <= MAX_BASE) setSourceBase(b);
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input, base: sourceBase })

  const result = useMemo(() => {
    if (!input.trim()) return { data: null, error: 'Enter a number to convert' };
    try {
      const conversions = convertBases(input, sourceBase);
      return {
        data: {
          conversions,
          places: placeValues(input, sourceBase),
          table: allBases(conversions.decimal),
          bits: bitLength(conversions.decimal),
        },
        error: null as string | null,
      };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Could not convert that number' };
    }
  }, [input, sourceBase]);

  const data = result.data;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  // Past a couple of dozen digits the breakdown is a wall of rows, not an explanation.
  const places = data && data.places.length <= 24 ? data.places : null;

  return (
    <Panel
      title="Base Converter Extended"
      description="Enter a number and the base it is written in, from [1 2 2] to [1 36 2]. Converts to every other base at once, shows what each digit of the input contributes, and stays exact on values far past 64 bits."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Number</label>
              <input
                className={inputClass}
                placeholder="255"
                value={input}
                onChange={e => setInput(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Source Base</label>
              <input
                type="number"
                min={MIN_BASE}
                max={MAX_BASE}
                className={inputClass}
                value={sourceBase}
                onChange={e => {
                  const v = parseInt(e.target.value);
                  if (v >= MIN_BASE && v <= MAX_BASE) setSourceBase(v);
                }}
              />
            </div>
          </div>

          {/* Quick base picks */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={labelClass}>Base</span>
            {[2, 8, 10, 16, 32, 36].map(b => (
              <button
                key={b}
                onClick={() => setSourceBase(b)}
                className={`px-3 py-1 text-xs font-mono border transition-colors ${
                  sourceBase === b
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                }`}
              >
                {b}
              </button>
            ))}
            <span className="text-xs text-gray-400 font-mono ml-1">
              digits {digitSet(sourceBase)}
            </span>
          </div>

          {result.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">
              {result.error}
            </div>
          )}

          {data && (
            <>
              {/* Headline */}
              <div className="bg-gray-900 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Decimal Value
                </p>
                <p className="text-4xl font-black text-white leading-none break-all">
                  {data.conversions.decimal}
                </p>
                <p className="text-sm text-gray-300 mt-2 font-mono">
                  {input.trim().toUpperCase()} in base {sourceBase} · needs {data.bits} bit
                  {data.bits === 1 ? '' : 's'}
                </p>
              </div>

              {/* The six common bases */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Common Bases{' '}
                  <span className="normal-case font-normal text-gray-400">(click to copy)</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
                  {COMMON_BASES.map(t => (
                    <BaseCard
                      key={t.base}
                      base={t.base}
                      label={t.label}
                      value={data.conversions[t.key]}
                    />
                  ))}
                </div>
              </div>

              {/* Place values */}
              {places && (
                <div>
                  <p className={`${labelClass} mb-2`}>
                    Digit By Digit{' '}
                    <span className="normal-case font-normal text-gray-400">
                      (each digit × {sourceBase}
                      <sup>position</sup>, summing to {data.conversions.decimal})
                    </span>
                  </p>
                  <div className="border border-gray-200 overflow-x-auto">
                    <table className="w-full min-w-[420px]">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className={`${labelClass} text-left px-3 py-2`}>Digit</th>
                          <th className={`${labelClass} text-left px-3 py-2`}>Value</th>
                          <th className={`${labelClass} text-left px-3 py-2`}>Weight</th>
                          <th className={`${labelClass} text-right px-3 py-2`}>Contributes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {places.map((p, i) => (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="px-3 py-2 font-mono text-sm font-bold text-gray-900">
                              {p.char}
                            </td>
                            <td className="px-3 py-2 font-mono text-sm text-gray-500">{p.digit}</td>
                            <td className="px-3 py-2 font-mono text-sm text-gray-500">
                              {sourceBase}
                              <sup>{p.power}</sup>
                            </td>
                            <td
                              className={`px-3 py-2 font-mono text-sm text-right ${
                                p.digit === 0 ? 'text-gray-400' : 'text-gray-900'
                              }`}
                            >
                              {p.contribution}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Every base */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Every Base{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (2 through 36, click a row to copy)
                  </span>
                </p>
                <div className="border border-gray-200 max-h-[340px] overflow-auto">
                  <table className="w-full">
                    <tbody>
                      {data.table.map(row => (
                        <tr
                          key={row.base}
                          onClick={() => copy(row.value)}
                          title="Click to copy"
                          className={`border-t border-gray-200 first:border-t-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                            row.base === sourceBase ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono text-xs text-gray-500 w-20 whitespace-nowrap align-top">
                            base {row.base}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-sm text-gray-900 break-all">
                            {row.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  The highlighted row is the base you typed the number in.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
