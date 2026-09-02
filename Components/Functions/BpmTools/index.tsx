'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { bpmToMs, msToBpm, noteDurations } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';

function getTempoName(bpm: number): string {
  if (bpm < 60) return 'Largo';
  if (bpm < 66) return 'Larghetto';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante / Moderato';
  if (bpm < 120) return 'Allegretto';
  if (bpm < 168) return 'Allegro';
  if (bpm < 200) return 'Presto';
  return 'Prestissimo';
}

function parseInput(raw: string): { bpm: number; ms: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const lc = trimmed.toLowerCase();
  if (lc.endsWith('ms')) {
    const ms = parseFloat(trimmed.slice(0, -2));
    if (isNaN(ms) || ms <= 0) return null;
    return { bpm: Math.round(msToBpm(ms) * 100) / 100, ms };
  }
  if (lc.endsWith('bpm')) {
    const bpm = parseFloat(trimmed.slice(0, -3));
    if (isNaN(bpm) || bpm <= 0) return null;
    return { bpm, ms: Math.round(bpmToMs(bpm) * 100) / 100 };
  }
  const n = parseFloat(trimmed);
  if (isNaN(n) || n <= 0) return null;
  if (n >= 20 && n <= 400) return { bpm: n, ms: Math.round(bpmToMs(n) * 100) / 100 };
  return { bpm: Math.round(msToBpm(n) * 100) / 100, ms: n };
}

export function BpmConverter() {
  const [input, setInput] = useState('');
  const tapTimesRef = useRef<number[]>([]);
  const [tapBpm, setTapBpm] = useState<number | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = useMemo(() => parseInput(input), [input]);
  const activeBpm = tapBpm ?? result?.bpm ?? null;
  const durations = useMemo(() => activeBpm ? noteDurations(activeBpm) : [], [activeBpm]);
  const maxMs = durations.length > 0 ? durations[0].ms : 1;

  const handleTap = useCallback(() => {
    const now = Date.now();
    const taps = tapTimesRef.current;
    // Reset if gap > 3s
    if (taps.length > 0 && now - taps[taps.length - 1] > 3000) {
      tapTimesRef.current = [now];
      setTapBpm(null);
      return;
    }
    taps.push(now);
    if (taps.length > 8) taps.splice(0, taps.length - 8);
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpm = Math.round((60000 / avgGap) * 10) / 10;
      setTapBpm(bpm);
      setInput(String(bpm));
    }
  }, []);

  return (
    <Panel
      title="BPM / MS Converter"
      description="Convert [1 BPM 2] to milliseconds and vice versa. Shows note durations (whole → thirty-second). Enter a [1 BPM 2] (e.g. 120) or milliseconds (e.g. [1 500ms 2]), or use tap tempo."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input + Tap */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className={labelClass}>BPM or Milliseconds</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. 120 or 500ms"
                value={input}
                onChange={e => { setInput(e.target.value); setTapBpm(null); }}
              />
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col">
              <label className={labelClass}>Tap Tempo</label>
              <button
                onClick={handleTap}
                className="flex-1 border border-gray-300 hover:border-gray-900 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-sm font-bold uppercase tracking-wider transition-colors duration-100 px-4 py-2 active:scale-95"
              >
                TAP
              </button>
            </div>
          </div>

          {activeBpm && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">BPM</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">{activeBpm}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">ms / beat</p>
                  <p className="text-2xl font-black text-gray-900 font-mono">{Math.round(bpmToMs(activeBpm) * 100) / 100}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Tempo</p>
                  <p className="text-base font-black text-gray-900 leading-tight">{getTempoName(activeBpm)}</p>
                </div>
              </div>

              {/* Note durations table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Note Durations at {activeBpm} BPM</p>
                <div className="border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Note</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 w-28">Duration</th>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Relative length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {durations.map((d, i) => {
                        const barPct = (d.ms / maxMs) * 100;
                        const isQuarter = d.name.startsWith('Quarter');
                        return (
                          <tr key={d.name} className={i > 0 ? 'border-t border-gray-200' : ''}>
                            <td className={`px-3 py-2 text-xs ${isQuarter ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                              {d.name}
                            </td>
                            <td className="px-3 py-2 text-xs font-mono text-gray-900 w-28">{d.ms} ms</td>
                            <td className="px-3 py-2">
                              <div className="w-full bg-gray-100 h-3 overflow-hidden">
                                <div
                                  className={`h-3 ${isQuarter ? 'bg-indigo-500' : 'bg-indigo-300'}`}
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {!activeBpm && (
            <p className="text-gray-400 text-sm text-center py-4">Enter a BPM or ms value, or tap the tempo above</p>
          )}
        </div>
      }
    />
  );
}
