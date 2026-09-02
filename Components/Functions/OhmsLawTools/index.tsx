'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  PresetRow,
  SectionTitle,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  OHMS_FORMULAS,
  QUANTITY_META,
  analyzeOhms,
  parseElectricalValue,
  parseOhmsInput,
  type OhmsQuantity,
  type OhmsReport,
  type OhmsValues,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const ORDER: OhmsQuantity[] = ['V', 'I', 'R', 'P'];

type Inputs = Record<OhmsQuantity, string>;

const EMPTY: Inputs = { V: '', I: '', R: '', P: '' };

const PRESETS: { label: string; value: Inputs }[] = [
  { label: '12 V, 2 A', value: { ...EMPTY, V: '12', I: '2' } },
  { label: '5 V, 4.7 kΩ', value: { ...EMPTY, V: '5', R: '4.7k' } },
  { label: '100 Ω, 5 W', value: { ...EMPTY, R: '100', P: '5' } },
  { label: '230 V, 60 W', value: { ...EMPTY, V: '230', P: '60' } },
  { label: '20 mA, 330 Ω', value: { ...EMPTY, I: '20m', R: '330' } },
];

const PLACEHOLDERS: Record<OhmsQuantity, string> = {
  V: '12  ·  5V  ·  1.5k',
  I: '2  ·  20m  ·  500u',
  R: '100  ·  4.7k  ·  1M',
  P: '5  ·  250m  ·  1.5k',
};

const COLOR_HEX: Record<string, string> = {
  black: '#1c1917', brown: '#78350f', red: '#dc2626', orange: '#ea580c',
  yellow: '#facc15', green: '#16a34a', blue: '#2563eb', violet: '#7c3aed',
  grey: '#78716c', white: '#fafaf9', gold: '#b8860b', silver: '#a8a29e',
};

/** A resistor drawn with its bands, because a list of colour names is not
 *  something you can hold up against the part in your hand. */
const ResistorDiagram = ({ report }: { report: OhmsReport }) => {
  if (!report.bands) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="border border-gray-200 bg-gray-50 px-4 py-6 overflow-x-auto">
        <div className="flex items-center min-w-[280px]">
          <div className="h-px flex-1 bg-gray-400" />
          <div
            className="flex items-center gap-2 px-4 py-0 h-16 rounded-[2rem] border border-gray-300"
            style={{ backgroundColor: '#e7d9b8' }}
          >
            {report.bands.map((band, i) => (
              <div
                key={i}
                title={`${band.role}: ${band.color} (${band.meaning})`}
                className="w-3 h-16 border-x"
                style={{
                  backgroundColor: COLOR_HEX[band.color] ?? '#888',
                  borderColor: 'rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>
          <div className="h-px flex-1 bg-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {report.bands.map((band, i) => (
          <div key={i} className="border border-gray-200 px-3 py-2 flex items-center gap-3">
            <span
              className="w-4 h-8 flex-shrink-0 border border-gray-300"
              style={{ backgroundColor: COLOR_HEX[band.color] ?? '#888' }}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{band.role}</div>
              <div className="font-mono text-sm text-gray-900 capitalize">{band.color}</div>
              <div className="font-mono text-[11px] text-gray-400">{band.meaning}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OhmsLaw = () => {
  const [inputs, setInputs] = useState<Inputs>({ ...EMPTY, V: '12', I: '2' });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    // The old tool took "V=12V\nI=2A" in one textarea, so ?from= links keep working.
    const from = params.get('from');
    const next: Inputs = { ...EMPTY };
    let touched = false;

    if (from) {
      try {
        const parsed = parseOhmsInput(from);
        for (const key of ORDER) {
          if (parsed[key] !== null) {
            next[key] = String(parsed[key]);
            touched = true;
          }
        }
      } catch {
        /* an unparseable link just leaves the defaults in place */
      }
    }

    for (const key of ORDER) {
      const value = params.get(key.toLowerCase());
      if (value) {
        next[key] = value;
        touched = true;
      }
    }

    if (touched) setInputs(next);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink(Object.fromEntries(ORDER.map((key) => [key.toLowerCase(), inputs[key]])))

  const { report, error, fieldErrors, filled } = useMemo(() => {
    const known: OhmsValues = { V: null, I: null, R: null, P: null };
    const fieldErrors: Partial<Record<OhmsQuantity, string>> = {};
    let filled = 0;

    for (const key of ORDER) {
      const raw = inputs[key].trim();
      if (!raw) continue;
      filled++;
      try {
        known[key] = parseElectricalValue(raw);
      } catch {
        fieldErrors[key] = `Cannot read "${raw}"`;
      }
    }

    if (Object.keys(fieldErrors).length > 0) return { report: null, error: '', fieldErrors, filled };
    if (filled < 2) return { report: null, error: '', fieldErrors, filled };

    try {
      return { report: analyzeOhms(known), error: '', fieldErrors, filled };
    } catch (e) {
      return { report: null, error: (e as Error).message, fieldErrors, filled };
    }
  }, [inputs]);

  const set = (key: OhmsQuantity, value: string) => setInputs(prev => ({ ...prev, [key]: value }));

  const usedFormulas = new Set(
    report?.quantities.map(q => q.formula).filter((f): f is string => f !== null) ?? []
  );

  return (
    <Panel
      title="Ohm's Law Calculator"
      description="Enter any two of [1 V, I, R, P 2] and the other two are solved from [1 V = I × R 2] and [1 P = V × I 2], with the identity used shown for each. Values take engineering prefixes — [1 4.7k 2], [1 20m 2], [1 500u 2] — and a resistance is drawn as colour bands with its nearest E24 part."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Inputs */}
          <div className="flex flex-col gap-3">
            <SectionTitle note={filled < 2 ? 'fill any two' : `${filled} of 4 given`}>Known values</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ORDER.map(key => {
                const meta = QUANTITY_META[key];
                const active = inputs[key].trim() !== '';
                return (
                  <div key={key} className="flex flex-col gap-1 min-w-0">
                    <label
                      className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
                      htmlFor={`ohms-${key}`}
                    >
                      {key} — {meta.name}{' '}
                      <span className="font-normal normal-case text-gray-400">({meta.unitName})</span>
                    </label>
                    <div className="relative">
                      <input
                        id={`ohms-${key}`}
                        className={`${inputClass} pr-8 ${active ? 'border-gray-900' : ''}`}
                        placeholder={PLACEHOLDERS[key]}
                        value={inputs[key]}
                        onChange={e => set(key, e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-gray-400 pointer-events-none">
                        {meta.unit}
                      </span>
                    </div>
                    {fieldErrors[key] && <span className="text-[11px] text-rose-700">{fieldErrors[key]}</span>}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <PresetRow presets={PRESETS} onPick={setInputs} />
              <button
                onClick={() => setInputs({ ...EMPTY })}
                className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
              >
                clear
              </button>
            </div>
          </div>

          {filled < 2 && Object.keys(fieldErrors).length === 0 && (
            <p className="border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
              Enter at least two values — the other two follow from them.
            </p>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}

          {report && (
            <>
              {report.notes.map(note => (
                <p key={note} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                  {note}
                </p>
              ))}

              {/* Solution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {report.quantities.map(q => (
                  <div
                    key={q.key}
                    className={`border px-3 py-3 min-w-0 ${
                      q.given ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {q.key} — {q.name}
                      </span>
                      <CopyButton text={q.formatted} label={q.name} />
                    </div>
                    <div className="font-mono text-xl font-black text-gray-900 break-all leading-tight">
                      {q.formatted}
                    </div>
                    <div className="mt-2">
                      {q.given ? (
                        <StatusBadge tone="neutral">given</StatusBadge>
                      ) : (
                        <span className="font-mono text-[11px] text-indigo-700">{q.formula ?? 'derived'}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* The wheel */}
              <div className="flex flex-col gap-2">
                <SectionTitle note="the ones used are highlighted">Ohm&rsquo;s law wheel</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {ORDER.map(key => (
                    <div key={key} className="border border-gray-200 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                        Solve for {key}
                      </div>
                      <div className="flex flex-col gap-1">
                        {OHMS_FORMULAS[key].map(formula => (
                          <span
                            key={formula}
                            className={`font-mono text-xs px-1.5 py-0.5 border ${
                              usedFormulas.has(formula)
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                                : 'border-transparent text-gray-500'
                            }`}
                          >
                            {formula}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resistor */}
              <div className="flex flex-col gap-2">
                <SectionTitle
                  note={
                    report.e24
                      ? `nearest E24 part: ${report.e24.formatted} (${report.e24.errorPercent.toFixed(1)}% off)`
                      : undefined
                  }
                >
                  Resistor
                </SectionTitle>
                {report.bands ? (
                  <ResistorDiagram report={report} />
                ) : (
                  <p className="border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
                    {report.R > 0 && isFinite(report.R)
                      ? `${report.quantities.find(q => q.key === 'R')!.formatted} falls outside the 4-band range (0.01 Ω to 99 GΩ), so there is no colour code for it.`
                      : 'A colour code needs a positive, finite resistance.'}
                  </p>
                )}
              </div>

              <div className="border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500 space-y-1">
                <p>Accepted prefixes: G, k, m (milli), u / μ. A bare number is taken as base units.</p>
                <p>
                  Bands assume a 4-band ±5% part; 5-band precision resistors carry a third significant digit.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
