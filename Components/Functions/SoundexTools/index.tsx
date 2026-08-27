'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { soundexEntries, SOUNDEX_GROUPS, type TraceStatus } from './logic';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const STATUS_STYLE: Record<TraceStatus, { box: string; letter: string; note: string }> = {
  first:     { box: 'bg-gray-900',              letter: 'text-white',     note: 'text-gray-400' },
  coded:     { box: 'bg-white border border-gray-900', letter: 'text-gray-900', note: 'text-gray-500' },
  ignored:   { box: 'bg-white border border-gray-200', letter: 'text-gray-300', note: 'text-gray-300' },
  dropped:   { box: 'bg-white border border-gray-200', letter: 'text-gray-400 line-through', note: 'text-gray-400' },
  truncated: { box: 'bg-gray-50 border border-dashed border-gray-300', letter: 'text-gray-300', note: 'text-gray-300' },
};

const DEFAULT_NAMES = 'Robert\nRupert\nRubin\nAshcraft\nAshcroft\nTymczak\nPfister\nHoneyman';

export function SoundexConverter() {
  const [input, setInput] = useState(DEFAULT_NAMES);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  const entries = useMemo(() => soundexEntries(input), [input]);

  // Names sharing a code are exactly what Soundex is for — surface the collisions.
  const groups = useMemo(() => {
    const byCode = new Map<string, string[]>();
    for (const e of entries) {
      if (e.error) continue;
      byCode.set(e.code, [...(byCode.get(e.code) ?? []), e.name]);
    }
    return [...byCode.entries()]
      .filter(([, names]) => names.length > 1)
      .sort((a, b) => b[1].length - a[1].length);
  }, [entries]);

  const active = entries[Math.min(selected, Math.max(entries.length - 1, 0))];
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  return (
    <Panel
      title="Soundex Code"
      description="Generate [1 Soundex phonetic codes 2] for names — one per line. Similar-sounding names like [1 Robert 2] and [1 Rupert 2] collapse to the same code, which is what makes Soundex useful for fuzzy name matching and genealogy. Select any name to see letter by letter how its code was built."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass}>Names <span className="normal-case font-normal text-gray-400">(one per line)</span></label>
              <button
                className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
                onClick={() => setInput(DEFAULT_NAMES)}
              >
                Load examples
              </button>
            </div>
            <textarea
              className={`${inputClass} h-28 resize-y`}
              placeholder="Robert&#10;Rupert"
              value={input}
              onChange={e => { setInput(e.target.value); setSelected(0); }}
            />
          </div>

          {active && !active.error && (
            <>
              {/* Code breakdown for the selected name */}
              <div className="border border-gray-200 p-5">
                <p className={`${labelClass} mb-3`}>{active.name}</p>
                <div className="flex items-center gap-2 mb-5 flex-wrap">
                  {active.code.split('').map((c, i) => (
                    <div
                      key={i}
                      className="w-14 h-16 bg-gray-900 flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => copy(active.code)}
                      title="Click to copy the full code"
                    >
                      <span className="text-2xl font-black text-white font-mono leading-none">{c}</span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-500 mt-1.5">
                        {i === 0 ? 'letter' : `digit ${i}`}
                      </span>
                    </div>
                  ))}
                  <button
                    className="ml-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900"
                    onClick={() => copy(active.code)}
                  >
                    Copy
                  </button>
                </div>

                {/* Letter-by-letter trace */}
                <p className={`${labelClass} mb-2`}>How it was built</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.trace.map((step, i) => {
                    const s = STATUS_STYLE[step.status];
                    return (
                      <div key={i} className={`px-2 py-1.5 w-[74px] text-center ${s.box}`}>
                        <p className={`font-mono text-base font-bold leading-none ${s.letter}`}>{step.letter}</p>
                        <p className={`text-[9px] mt-1 leading-tight ${s.note}`}>{step.note}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* All names */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  All Codes <span className="normal-case font-normal text-gray-400">({entries.length} names — click to inspect)</span>
                </p>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {entries.map((e, i) => (
                        <tr
                          key={`${e.name}-${i}`}
                          className={`${i > 0 ? 'border-t border-gray-200' : ''} cursor-pointer ${
                            i === selected ? 'bg-gray-900' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelected(i)}
                        >
                          <td className={`px-4 py-2 font-mono ${i === selected ? 'text-white' : 'text-gray-900'}`}>
                            {e.name}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {e.error ? (
                              <span className="text-red-600 text-xs font-mono">{e.error}</span>
                            ) : (
                              <span
                                className={`font-mono font-black tracking-widest ${
                                  i === selected ? 'text-white' : 'text-gray-900'
                                }`}
                              >
                                {e.code}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Collisions */}
          {groups.length > 0 && (
            <div>
              <p className={`${labelClass} mb-2`}>Matching Names</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 border border-gray-200">
                {groups.map(([code, names]) => (
                  <div key={code} className="bg-white p-4">
                    <p className="font-mono font-black tracking-widest text-gray-900 mb-1">{code}</p>
                    <p className="text-sm text-gray-500">{names.join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div>
            <p className={`${labelClass} mb-2`}>Letter Groups</p>
            <div className="flex flex-wrap gap-px bg-gray-200 border border-gray-200">
              {SOUNDEX_GROUPS.map(g => (
                <div key={g.digit} className="bg-white px-4 py-2.5 flex-1 min-w-[120px]">
                  <p className="text-lg font-black font-mono text-gray-900 leading-none">{g.digit}</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">{g.letters}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              The first letter is kept as-is. Adjacent letters with the same digit collapse into one; vowels break a run
              while H and W do not. The result is padded to four characters.
            </p>
          </div>
        </div>
      }
    />
  );
}
