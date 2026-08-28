'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeEntropy } from './logic';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const LEVEL_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-emerald-600',
];

const SAMPLES: { label: string; value: string }[] = [
  { label: 'Password', value: 'Tr0ub4dor&3' },
  { label: 'Passphrase', value: 'correct horse battery staple' },
  { label: 'Random key', value: 'x7Kq!9mZ#pL2vR@8tW4nB^cF6' },
  { label: 'Repetitive', value: 'aaaaaaaaaaaaaaaa' },
];

export function EntropyCalculator() {
  const [input, setInput] = useState(SAMPLES[1].value);

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const result = useMemo(() => {
    if (!input) return null;
    try {
      return { data: analyzeEntropy(input), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [input]);

  const data = result?.data ?? null;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  // The meter is scaled against 8 bits/char — the ceiling for byte data.
  const meterPct = data ? Math.min(100, (data.entropy / 8) * 100) : 0;
  const maxPct = data ? Math.min(100, (data.maxEntropy / 8) * 100) : 0;
  const topCount = data?.frequencies[0]?.count ?? 1;

  return (
    <Panel
      title="String Entropy Calculator"
      description="Measure the [1 Shannon entropy 2] of any string — how many bits of information each character actually carries. The meter compares observed entropy against the ceiling for the alphabet used, and the histogram shows exactly which characters are dragging it down."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <label className={labelClass}>Input Text</label>
              <div className="flex flex-wrap gap-3">
                {SAMPLES.map(s => (
                  <button
                    key={s.label}
                    className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
                    onClick={() => setInput(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className={`${inputClass} h-24 resize-y`}
              placeholder="e.g. correct horse battery staple"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {result?.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">
              {result.error}
            </div>
          )}

          {data && (
            <>
              {/* Entropy meter */}
              <div className="border border-gray-200 p-5">
                <div className="flex items-end justify-between mb-3 gap-4 flex-wrap">
                  <div>
                    <p className={`${labelClass} mb-1`}>Shannon Entropy</p>
                    <p className="text-4xl font-black text-gray-900 leading-none">
                      {data.entropy.toFixed(3)}
                      <span className="text-base font-bold text-gray-400 ml-2">bits / char</span>
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-700">{data.assessment}</p>
                </div>

                <div className="relative h-4 bg-gray-100">
                  <div
                    className={`absolute inset-y-0 left-0 ${LEVEL_COLORS[data.level]}`}
                    style={{ width: `${meterPct}%` }}
                  />
                  {/* Ceiling for the observed alphabet */}
                  <div className="absolute inset-y-0 w-px bg-gray-900" style={{ left: `${maxPct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-mono text-gray-400 gap-2">
                  <span>0</span>
                  <span className="text-center">
                    ceiling for {data.uniqueChars} unique chars — {data.maxEntropy.toFixed(3)} bits
                  </span>
                  <span>8</span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Using <span className="font-bold text-gray-900">{(data.efficiency * 100).toFixed(1)}%</span> of the
                  entropy its own alphabet allows.
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Length</p>
                  <p className="text-2xl font-black text-gray-900">{data.length}</p>
                  <p className="text-xs text-gray-400 mt-0.5">characters</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Unique</p>
                  <p className="text-2xl font-black text-gray-900">{data.uniqueChars}</p>
                  <p className="text-xs text-gray-400 mt-0.5">distinct chars</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Total Entropy</p>
                  <p className="text-2xl font-black text-gray-900">{data.totalBits.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">bits observed</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Search Space</p>
                  <p className="text-2xl font-black text-gray-900">{data.bruteForceBits.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">bits, pool of {data.poolSize}</p>
                </div>
              </div>

              {/* Character classes */}
              <div>
                <p className={`${labelClass} mb-2`}>Character Classes</p>
                <div className="flex flex-wrap gap-px bg-gray-200 border border-gray-200">
                  {data.charsets.map(c => (
                    <div
                      key={c.name}
                      className={`px-4 py-2.5 flex-1 min-w-[110px] ${c.present ? 'bg-gray-900' : 'bg-white'}`}
                    >
                      <p className={`text-xs font-bold ${c.present ? 'text-white' : 'text-gray-400'}`}>{c.name}</p>
                      <p className={`text-[10px] font-mono mt-0.5 ${c.present ? 'text-gray-400' : 'text-gray-300'}`}>
                        {c.present ? `+${c.size} to pool` : 'absent'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frequency histogram */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Character Frequency{' '}
                  <span className="normal-case font-normal text-gray-400">
                    ({data.frequencies.length} distinct, most common first)
                  </span>
                </p>
                <div className="border border-gray-200 divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {data.frequencies.map(f => (
                    <div key={f.char} className="flex items-center gap-3 px-3 py-1.5">
                      <span className="font-mono text-sm text-gray-900 w-12 flex-shrink-0 truncate" title={f.display}>
                        {f.display}
                      </span>
                      <div className="flex-1 h-3 bg-gray-100 min-w-0">
                        <div className="h-full bg-gray-900" style={{ width: `${(f.count / topCount) * 100}%` }} />
                      </div>
                      <span className="font-mono text-xs text-gray-500 w-10 text-right flex-shrink-0">{f.count}×</span>
                      <span className="font-mono text-xs text-gray-400 w-14 text-right flex-shrink-0">
                        {(f.share * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
