'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { computeZScore, normalPDF, twoTailedOdds } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

// The curve is drawn from -4σ to +4σ, which holds all but 0.006% of the mass.
const Z_SPAN = 4;
const W = 720;
const H = 220;
const PAD_BOTTOM = 24;

const xFor = (z: number) => ((z + Z_SPAN) / (2 * Z_SPAN)) * W;
const yFor = (density: number) => H - PAD_BOTTOM - (density / normalPDF(0)) * (H - PAD_BOTTOM - 12);

/** The bell curve as an SVG path, plus the filled area up to `upTo`. */
function curvePaths(upTo: number) {
  const steps = 240;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const z = -Z_SPAN + (i / steps) * 2 * Z_SPAN;
    pts.push(`${xFor(z).toFixed(2)},${yFor(normalPDF(z)).toFixed(2)}`);
  }
  const outline = `M ${pts.join(' L ')}`;

  const clamped = Math.max(-Z_SPAN, Math.min(Z_SPAN, upTo));
  const fill: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const z = -Z_SPAN + (i / steps) * (clamped + Z_SPAN);
    fill.push(`${xFor(z).toFixed(2)},${yFor(normalPDF(z)).toFixed(2)}`);
  }
  const baseline = H - PAD_BOTTOM;
  const area = `M ${xFor(-Z_SPAN).toFixed(2)},${baseline} L ${fill.join(' L ')} L ${xFor(clamped).toFixed(2)},${baseline} Z`;

  return { outline, area };
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white p-4">
      <p className={`${labelClass} mb-1`}>{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </div>
  );
}

export function ZScoreCalculator() {
  const [value, setValue] = useState('70');
  const [mean, setMean] = useState('60');
  const [sigma, setSigma] = useState('10');

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) {
      // Share links carry the three numbers newline separated, as the old text UI did.
      const lines = from.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines[0]) setValue(lines[0]);
      if (lines[1]) setMean(lines[1]);
      if (lines[2]) setSigma(lines[2]);
    }
    if (p.get('mean')) setMean(p.get('mean') as string);
    if (p.get('sd')) setSigma(p.get('sd') as string);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: value, mean, sd: sigma })

  const result = useMemo(() => {
    const x = parseFloat(value);
    const mu = parseFloat(mean);
    const sd = parseFloat(sigma);
    if (isNaN(x) || isNaN(mu) || isNaN(sd)) {
      return { data: null, error: 'Enter a value, a mean, and a standard deviation' };
    }
    try {
      const r = computeZScore(x, mu, sd);
      return { data: { x, mu, sd, ...r, odds: twoTailedOdds(r.zScore) }, error: null as string | null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Could not compute the Z-score' };
    }
  }, [value, mean, sigma]);

  const data = result.data;
  const paths = useMemo(() => curvePaths(data ? data.zScore : 0), [data]);
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  const markerZ = data ? Math.max(-Z_SPAN, Math.min(Z_SPAN, data.zScore)) : 0;
  const offScale = data ? Math.abs(data.zScore) > Z_SPAN : false;

  return (
    <Panel
      title="Z-Score / Normal Distribution Calculator"
      description="Enter an observation with the [1 mean 2] and [1 standard deviation 2] of its population. Gives the Z-score, where it lands on the bell curve, its percentile rank, the tail probabilities either side of it, and how rare a reading that far out actually is."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Value (x)</label>
              <input className={inputClass} placeholder="70" value={value} onChange={e => setValue(e.target.value)} />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Mean (µ)</label>
              <input className={inputClass} placeholder="60" value={mean} onChange={e => setMean(e.target.value)} />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Std Deviation (σ)</label>
              <input className={inputClass} placeholder="10" value={sigma} onChange={e => setSigma(e.target.value)} />
            </div>
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
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">Z-Score</p>
                <p className="text-4xl font-black text-white leading-none">
                  {data.zScore >= 0 ? '+' : ''}
                  {data.zScore.toFixed(4)}
                </p>
                <p className="text-sm text-gray-300 mt-2 font-mono">
                  {data.x} is {Math.abs(data.zScore).toFixed(2)}σ {data.zScore >= 0 ? 'above' : 'below'} a mean of{' '}
                  {data.mu}
                </p>
              </div>

              {/* The curve */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Where It Lands{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (shaded area = P(X &lt; {data.x}) = {(data.probLess * 100).toFixed(2)}%)
                  </span>
                </p>
                <div className="border border-gray-200 bg-white p-3 overflow-x-auto">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[480px]" role="img" aria-label="Normal distribution curve">
                    {/* sigma gridlines */}
                    {[-3, -2, -1, 0, 1, 2, 3].map(t => (
                      <g key={t}>
                        <line
                          x1={xFor(t)}
                          x2={xFor(t)}
                          y1={12}
                          y2={H - PAD_BOTTOM}
                          stroke={t === 0 ? '#9ca3af' : '#e5e7eb'}
                          strokeWidth={1}
                        />
                        <text
                          x={xFor(t)}
                          y={H - 8}
                          textAnchor="middle"
                          className="fill-gray-400"
                          style={{ fontSize: 11, fontFamily: 'monospace' }}
                        >
                          {t > 0 ? `+${t}σ` : `${t}σ`}
                        </text>
                      </g>
                    ))}
                    <line
                      x1={0}
                      x2={W}
                      y1={H - PAD_BOTTOM}
                      y2={H - PAD_BOTTOM}
                      stroke="#d1d5db"
                      strokeWidth={1}
                    />
                    <path d={paths.area} fill="#10b981" fillOpacity={0.35} />
                    <path d={paths.outline} fill="none" stroke="#111827" strokeWidth={2} />
                    {/* the observation */}
                    <line
                      x1={xFor(markerZ)}
                      x2={xFor(markerZ)}
                      y1={12}
                      y2={H - PAD_BOTTOM}
                      stroke="#111827"
                      strokeWidth={2}
                      strokeDasharray={offScale ? '4 3' : undefined}
                    />
                    <circle cx={xFor(markerZ)} cy={yFor(normalPDF(markerZ))} r={4} fill="#111827" />
                    <text
                      x={Math.min(W - 4, Math.max(4, xFor(markerZ)))}
                      y={8}
                      textAnchor={markerZ > 2 ? 'end' : markerZ < -2 ? 'start' : 'middle'}
                      className="fill-gray-900"
                      style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700 }}
                    >
                      x = {data.x}
                      {offScale ? ' (off scale)' : ''}
                    </text>
                  </svg>
                </div>
                <div className="flex gap-5 mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-emerald-500 inline-block opacity-40" /> below x
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 bg-gray-900 inline-block" /> the observation
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
                <Stat
                  label="Percentile"
                  value={`${data.percentile.toFixed(2)}%`}
                  hint="of the population is lower"
                />
                <Stat label="P(X < x)" value={data.probLess.toFixed(6)} hint="left tail" />
                <Stat label="P(X > x)" value={data.probGreater.toFixed(6)} hint="right tail" />
                <Stat
                  label="Rarity"
                  value={data.odds === null ? '—' : `1 in ${Math.round(data.odds).toLocaleString('en-US')}`}
                  hint="this far out, either side"
                />
              </div>

              {/* Interpretation + sigma ruler in raw units */}
              <div className="border border-gray-200 p-4">
                <p className={`${labelClass} mb-2`}>Reading</p>
                <p className="text-sm text-gray-700 mb-4">{data.interpretation}</p>
                <div className="flex gap-px bg-gray-200 border border-gray-200">
                  {[-3, -2, -1, 0, 1, 2, 3].map(t => {
                    const bound = data.mu + t * data.sd;
                    const nearest = Math.round(data.zScore);
                    const active = nearest === t && Math.abs(data.zScore) <= 3.5;
                    return (
                      <div key={t} className={`flex-1 p-2 text-center ${active ? 'bg-gray-900' : 'bg-white'}`}>
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-gray-300' : 'text-gray-400'}`}
                        >
                          {t > 0 ? `+${t}σ` : `${t}σ`}
                        </p>
                        <p className={`text-xs font-mono ${active ? 'text-white font-bold' : 'text-gray-900'}`}>
                          {Number(bound.toPrecision(6))}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  The highlighted band is the σ step your value rounds to.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
