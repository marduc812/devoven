'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  FUNCTION_META,
  MAX_TERMS,
  SUPPORTED_FUNCTIONS,
  computePartialSum,
  exactValue,
  termValues,
  type SupportedFunction,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const W = 720;
const H = 260;
const PAD = { left: 44, right: 12, top: 12, bottom: 26 };
const TERM_CHECKPOINTS = [1, 2, 3, 5, 10, 20];

const sig = (n: number) => {
  if (!isFinite(n)) return n > 0 ? '∞' : '−∞';
  if (n !== 0 && Math.abs(n) < 1e-4) return n.toExponential(4);
  if (Math.abs(n) >= 1e7) return n.toExponential(4);
  return Number(n.toPrecision(10)).toString();
};

export function TaylorSeriesCalculator() {
  const [fnName, setFnName] = useState<SupportedFunction>('sin');
  const [xText, setXText] = useState('1');
  const [terms, setTerms] = useState(3);

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (from) setXText(from.trim());
    const fn = p.get('fn');
    if (fn && fn in FUNCTION_META) setFnName(fn as SupportedFunction);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: xText, fn: fnName })

  const meta = FUNCTION_META[fnName];

  const result = useMemo(() => {
    const x = parseFloat(xText);
    if (isNaN(x)) return { data: null, error: 'x must be a number' };
    if (fnName === 'ln1p' && x <= -1) return { data: null, error: 'ln(1+x) requires x > −1' };
    if (fnName === 'geometric' && Math.abs(x) >= 1) {
      return { data: null, error: 'The 1/(1-x) series requires |x| < 1' };
    }

    const exact = exactValue(fnName, x);
    const approx = computePartialSum(fnName, x, terms);
    const error = Math.abs(exact - approx);

    const checkpoints = TERM_CHECKPOINTS.map(n => {
      const a = computePartialSum(fnName, x, n);
      const err = Math.abs(exact - a);
      return {
        terms: n,
        approximation: a,
        error: err,
        relativeError: Math.abs(exact) > 1e-15 ? err / Math.abs(exact) : err,
      };
    });

    return {
      data: {
        x,
        exact,
        approx,
        error,
        relativeError: Math.abs(exact) > 1e-15 ? error / Math.abs(exact) : error,
        checkpoints,
        contributions: termValues(fnName, x, terms),
      },
      error: null as string | null,
    };
  }, [fnName, xText, terms]);

  const data = result.data;

  // The plot: true curve against the current partial sum, over the function's window.
  const plot = useMemo(() => {
    const [d0, d1] = meta.domain;
    const steps = 200;
    const xs = Array.from({ length: steps + 1 }, (_, i) => d0 + (i / steps) * (d1 - d0));
    const exactYs = xs.map(x => exactValue(fnName, x));
    const approxYs = xs.map(x => computePartialSum(fnName, x, terms));

    // Scale to the true function only, so a diverging partial sum cannot flatten it.
    const finite = exactYs.filter(y => isFinite(y));
    let yMin = Math.min(...finite);
    let yMax = Math.max(...finite);
    const pad = (yMax - yMin) * 0.25 || 1;
    yMin -= pad;
    yMax += pad;

    const px = (x: number) => PAD.left + ((x - d0) / (d1 - d0)) * (W - PAD.left - PAD.right);
    const py = (y: number) => PAD.top + (1 - (y - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom);

    const toPath = (ys: number[]) => {
      let path = '';
      let open = false;
      ys.forEach((y, i) => {
        if (!isFinite(y)) { open = false; return; }
        // Keep the path from wandering absurdly far outside the frame.
        const clamped = Math.max(yMin - (yMax - yMin), Math.min(yMax + (yMax - yMin), y));
        path += `${open ? ' L ' : ' M '}${px(xs[i]).toFixed(2)},${py(clamped).toFixed(2)}`;
        open = true;
      });
      return path.trim();
    };

    return {
      d0, d1, yMin, yMax, px, py,
      exactPath: toPath(exactYs),
      approxPath: toPath(approxYs),
      zeroY: yMin <= 0 && yMax >= 0 ? py(0) : null,
      zeroX: d0 <= 0 && d1 >= 0 ? px(0) : null,
    };
  }, [fnName, terms, meta.domain]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';
  const peakContribution = data
    ? Math.max(...data.contributions.map(t => Math.abs(t.value)), Number.MIN_VALUE)
    : 1;
  const sliderX = data ? Math.max(meta.domain[0], Math.min(meta.domain[1], data.x)) : 0;

  return (
    <Panel
      title="Taylor Series Calculator"
      description="Pick a function, an x, and how many terms to sum. Plots the [1 partial sum 2] against the real curve so you can watch the polynomial hug it near zero and peel away outside the [1 radius of convergence 2], with the error at each term count alongside."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Function picker */}
          <div>
            <p className={`${labelClass} mb-2`}>Function</p>
            <div className="flex flex-wrap gap-px bg-gray-200 border border-gray-200">
              {SUPPORTED_FUNCTIONS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFnName(f.value)}
                  className={`px-4 py-2 font-mono text-sm ${
                    fnName === f.value ? 'bg-gray-900 text-white font-bold' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2 font-mono">{meta.formula}</p>
          </div>

          {/* x and term count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>x</label>
              <input className={inputClass} placeholder="1" value={xText} onChange={e => setXText(e.target.value)} />
              <input
                type="range"
                min={meta.domain[0]}
                max={meta.domain[1]}
                step={(meta.domain[1] - meta.domain[0]) / 200}
                value={sliderX}
                onChange={e => setXText(Number(parseFloat(e.target.value).toFixed(3)).toString())}
                className="w-full mt-2 accent-gray-900"
                aria-label="x value"
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Terms: {terms}</label>
              <input
                className={inputClass}
                value={String(terms)}
                onChange={e => {
                  const n = parseInt(e.target.value, 10);
                  if (!isNaN(n)) setTerms(Math.max(1, Math.min(MAX_TERMS, n)));
                }}
              />
              <input
                type="range"
                min={1}
                max={MAX_TERMS}
                step={1}
                value={terms}
                onChange={e => setTerms(parseInt(e.target.value, 10))}
                className="w-full mt-2 accent-gray-900"
                aria-label="Number of terms"
              />
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
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {terms} {terms === 1 ? 'term' : 'terms'} at x = {sig(data.x)}
                </p>
                <p className="text-4xl font-black text-white leading-none break-all">{sig(data.approx)}</p>
                <p className="text-sm text-gray-300 mt-2 font-mono break-all">
                  exact {sig(data.exact)} · off by {data.error === 0 ? '0' : data.error.toExponential(3)}
                </p>
              </div>

              {/* Plot */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Partial Sum vs The Real Curve{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (x from {sig(Number(plot.d0.toFixed(2)))} to {sig(Number(plot.d1.toFixed(2)))})
                  </span>
                </p>
                <div className="border border-gray-200 bg-white p-3 overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full h-auto min-w-[480px]"
                    role="img"
                    aria-label={`${meta.label} against its ${terms}-term Taylor polynomial`}
                  >
                    <defs>
                      <clipPath id="taylor-frame">
                        <rect
                          x={PAD.left}
                          y={PAD.top}
                          width={W - PAD.left - PAD.right}
                          height={H - PAD.top - PAD.bottom}
                        />
                      </clipPath>
                    </defs>
                    {/* frame + axes */}
                    <rect
                      x={PAD.left}
                      y={PAD.top}
                      width={W - PAD.left - PAD.right}
                      height={H - PAD.top - PAD.bottom}
                      fill="none"
                      stroke="#e5e7eb"
                    />
                    {plot.zeroY !== null && (
                      <line x1={PAD.left} x2={W - PAD.right} y1={plot.zeroY} y2={plot.zeroY} stroke="#d1d5db" />
                    )}
                    {plot.zeroX !== null && (
                      <line x1={plot.zeroX} x2={plot.zeroX} y1={PAD.top} y2={H - PAD.bottom} stroke="#d1d5db" />
                    )}
                    {/* y labels */}
                    <text x={PAD.left - 6} y={PAD.top + 10} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                      {Number(plot.yMax.toPrecision(3))}
                    </text>
                    <text x={PAD.left - 6} y={H - PAD.bottom} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                      {Number(plot.yMin.toPrecision(3))}
                    </text>
                    {/* x labels */}
                    <text x={PAD.left} y={H - 8} className="fill-gray-400" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                      {Number(plot.d0.toPrecision(3))}
                    </text>
                    <text x={W - PAD.right} y={H - 8} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10, fontFamily: 'monospace' }}>
                      {Number(plot.d1.toPrecision(3))}
                    </text>

                    <g clipPath="url(#taylor-frame)">
                      <path d={plot.approxPath} fill="none" stroke="#10b981" strokeWidth={2.5} />
                      <path d={plot.exactPath} fill="none" stroke="#111827" strokeWidth={2} />
                      {/* the evaluation point */}
                      <line
                        x1={plot.px(sliderX)}
                        x2={plot.px(sliderX)}
                        y1={PAD.top}
                        y2={H - PAD.bottom}
                        stroke="#111827"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                      />
                      {isFinite(data.exact) && <circle cx={plot.px(sliderX)} cy={plot.py(data.exact)} r={4} fill="#111827" />}
                      {isFinite(data.approx) && (
                        <circle
                          cx={plot.px(sliderX)}
                          cy={plot.py(data.approx)}
                          r={4}
                          fill="#ffffff"
                          stroke="#10b981"
                          strokeWidth={2.5}
                        />
                      )}
                    </g>
                  </svg>
                </div>
                <div className="flex flex-wrap gap-5 mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gray-900 inline-block" /> {meta.label}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-emerald-500 inline-block" /> {terms}-term polynomial</span>
                  <span className="normal-case font-normal">{meta.convergence}</span>
                </div>
              </div>

              {/* Convergence checkpoints */}
              <div>
                <p className={`${labelClass} mb-2`}>Error by Term Count</p>
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-500 uppercase tracking-wider">
                        <th className="text-left font-bold px-3 py-2">Terms</th>
                        <th className="text-right font-bold px-3 py-2">Approximation</th>
                        <th className="text-right font-bold px-3 py-2">Abs Error</th>
                        <th className="text-right font-bold px-3 py-2 hidden sm:table-cell">Rel Error</th>
                        <th className="text-left font-bold px-3 py-2 w-1/4">Digits Correct</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.checkpoints.map(c => {
                        // One correct digit per power of ten the relative error is below.
                        const digits = c.relativeError > 0 ? Math.max(0, -Math.log10(c.relativeError)) : 16;
                        return (
                          <tr key={c.terms} className={c.terms === terms ? 'bg-emerald-50' : ''}>
                            <td className="px-3 py-1.5 text-gray-400">
                              {c.terms}
                              {c.terms === terms && <span className="text-emerald-600 font-bold"> ←</span>}
                            </td>
                            <td className="px-3 py-1.5 text-right text-gray-900">{sig(c.approximation)}</td>
                            <td className="px-3 py-1.5 text-right text-gray-500">
                              {c.error === 0 ? '0' : c.error.toExponential(3)}
                            </td>
                            <td className="px-3 py-1.5 text-right text-gray-500 hidden sm:table-cell">
                              {c.relativeError === 0 ? '0' : c.relativeError.toExponential(3)}
                            </td>
                            <td className="px-3 py-1.5">
                              <span className="flex items-center gap-2">
                                <span className="flex-1 h-2 bg-gray-100 min-w-[40px]">
                                  <span
                                    className="block h-2 bg-emerald-500"
                                    style={{ width: `${Math.min(100, (digits / 16) * 100)}%` }}
                                  />
                                </span>
                                <span className="text-gray-500 w-6 text-right">{Math.floor(Math.min(16, digits))}</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Term by term */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Term by Term{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (what each term adds at x = {sig(data.x)})
                  </span>
                </p>
                <div className="border border-gray-200 divide-y divide-gray-100 max-h-72 overflow-y-auto">
                  {data.contributions.map(t => {
                    const width = (Math.abs(t.value) / peakContribution) * 100;
                    return (
                      <div key={t.index} className="flex items-center gap-3 px-3 py-1.5">
                        <span className="font-mono text-xs text-gray-400 w-8 flex-shrink-0">#{t.index}</span>
                        <span className="flex-1 flex h-3 min-w-0 bg-gray-50">
                          {/* Negative terms grow leftward from the centre, positive rightward. */}
                          <span className="w-1/2 flex justify-end">
                            {t.value < 0 && <span className="block h-3 bg-amber-400" style={{ width: `${width}%` }} />}
                          </span>
                          <span className="w-1/2">
                            {t.value >= 0 && <span className="block h-3 bg-emerald-500" style={{ width: `${width}%` }} />}
                          </span>
                        </span>
                        <span className="font-mono text-xs text-gray-900 w-32 text-right flex-shrink-0 truncate">
                          {t.value === 0 ? '0' : sig(t.value)}
                        </span>
                        <span className="font-mono text-xs text-gray-400 w-32 text-right flex-shrink-0 truncate hidden sm:block">
                          → {sig(t.partial)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-5 mt-2 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 inline-block" /> adds</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-amber-400 inline-block" /> subtracts</span>
                  <span className="hidden sm:inline normal-case font-normal">right column = running total</span>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
