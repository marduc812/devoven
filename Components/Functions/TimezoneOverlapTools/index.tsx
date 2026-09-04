'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { findOverlap, parseTimezoneInput } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'UTC, EST, JST', value: 'UTC, EST, JST' },
  { label: 'PST, CET, IST', value: 'PST, CET, IST' },
  { label: 'London / NY', value: 'GMT, EST' },
  { label: 'Offsets', value: 'UTC+2, UTC-8, UTC+5:30' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimezoneOverlapFinder() {
  const [input, setInput] = useState('UTC, EST, JST');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' };
    try {
      return { result: findOverlap(parseTimezoneInput(input)), error: '' };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [input]);

  const overlapSet = useMemo(() => new Set(result?.workingHoursOverlap ?? []), [result]);

  const best = result?.meetingSuggestions[0] ?? null;

  return (
    <Panel
      title="Timezone Overlap Finder"
      description="Find the working-hours overlap between 2–4 timezones. Accepts abbreviations or offsets — [1 UTC, EST, JST 2] or [1 UTC+2, PST, CET 2]. Shows a 24-hour timeline per zone with the shared 9am–5pm window highlighted."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Timezones{' '}
              <span className="font-normal text-gray-400 normal-case">comma-separated, 2 to 4</span>
            </label>
            <input
              className={inputClass}
              placeholder="UTC, EST, JST"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              {/* Zones */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {result.zones.map(z => (
                  <StatTile
                    key={z.input}
                    label={z.name}
                    value={`UTC${z.offsetLabel}`}
                    hint={z.input !== z.name ? `entered as "${z.input}"` : undefined}
                  />
                ))}
              </div>

              {/* Overlap summary */}
              <div
                className={`border px-4 py-4 ${
                  overlapSet.size > 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Shared working hours
                  </span>
                  <StatusBadge tone={overlapSet.size > 0 ? 'pass' : 'warn'}>
                    {overlapSet.size > 0 ? `${overlapSet.size}h overlap` : 'no overlap'}
                  </StatusBadge>
                </div>
                {overlapSet.size > 0 ? (
                  <>
                    <div className="font-mono text-xl sm:text-2xl font-black text-gray-900">
                      {result.workingHoursOverlap
                        .map(h => `${String(h).padStart(2, '0')}:00`)
                        .join('  ')}{' '}
                      <span className="text-sm font-bold text-gray-500">UTC</span>
                    </div>
                    {best && (
                      <div className="text-xs text-gray-600 mt-2">
                        Best slot <span className="font-bold">{best.label}</span> —{' '}
                        {best.times.join(' · ')}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-600">
                    These zones share no 9am–5pm hours. The timeline below shows how close they get.
                  </p>
                )}
              </div>

              {/* Timeline */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="local hour in each zone; shaded cells are 9am–5pm">
                  24-hour timeline
                </SectionTitle>

                <div className="border border-gray-200 overflow-x-auto">
                  <div className="min-w-fit p-3">
                    {/* UTC scale */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-24 flex-shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        UTC
                      </span>
                      <div className="flex gap-px">
                        {HOURS.map(h => (
                          <span
                            key={h}
                            className={`w-7 text-center font-mono text-[10px] ${
                              overlapSet.has(h) ? 'text-emerald-700 font-bold' : 'text-gray-400'
                            }`}
                          >
                            {String(h).padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* One row per zone */}
                    {result.zones.map((zone, zi) => (
                      <div key={zone.input} className="flex items-center gap-2 mb-1">
                        <span
                          className="w-24 flex-shrink-0 font-mono text-xs text-gray-900 truncate"
                          title={`${zone.name} (UTC${zone.offsetLabel})`}
                        >
                          {zone.name}
                        </span>
                        <div className="flex gap-px">
                          {result.grid.map(row => {
                            const cell = row.cells[zi];
                            const inOverlap = overlapSet.has(row.utcHour);
                            return (
                              <span
                                key={row.utcHour}
                                title={`${row.utcLabel} → ${cell.label} local${
                                  cell.isWorkingHour ? ' · working hour' : ''
                                }`}
                                className={`w-7 h-8 flex items-center justify-center font-mono text-[10px] border ${
                                  inOverlap
                                    ? 'bg-emerald-200 border-emerald-400 text-emerald-900 font-bold'
                                    : cell.isWorkingHour
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : 'bg-white border-gray-200 text-gray-400'
                                }`}
                              >
                                {String(Math.floor(cell.localHour)).padStart(2, '0')}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-200 border border-emerald-400" /> everyone
                    working
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-50 border border-emerald-200" /> working
                    hours
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-white border border-gray-200" /> outside hours
                  </span>
                </div>
              </div>

              {/* Meeting suggestions */}
              {result.meetingSuggestions.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle note="ranked by how close each slot sits to midday everywhere">
                    Meeting suggestions
                  </SectionTitle>
                  <div className="border border-gray-200 divide-y divide-gray-200">
                    {result.meetingSuggestions.map((s, i) => (
                      <div
                        key={s.utcHour}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 ${
                          i === 0 ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <span className="font-mono text-sm font-bold text-gray-900 w-28 flex-shrink-0">
                          {s.label}
                        </span>
                        <span className="font-mono text-xs text-gray-600 flex-1 min-w-0">
                          {s.times.join(' · ')}
                        </span>
                        {i === 0 && <StatusBadge tone="pass">best</StatusBadge>}
                      </div>
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
}
