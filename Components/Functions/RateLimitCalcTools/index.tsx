'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  RateUnit,
  parseRateString,
  rateFromParts,
  marginRates,
  requestInterval,
  humanDuration,
  tokenBucketParams,
  perClientRates,
  backoffSchedule,
} from './logic';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

const UNITS: { value: RateUnit; label: string }[] = [
  { value: 'second', label: 'per second' },
  { value: 'minute', label: 'per minute' },
  { value: 'hour', label: 'per hour' },
  { value: 'day', label: 'per day' },
];

const MARGINS = [100, 95, 90, 80, 70, 50];

/** Request counts: whole numbers stay whole, small fractions keep their detail. */
const count = (n: number): string => {
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  if (n >= 1000) return Math.round(n).toLocaleString('en-US');
  if (n >= 10) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 0.001) return n.toFixed(4);
  return n.toExponential(2);
};

export const RateLimitCalculator = () => {
  const [requests, setRequests] = useState('1000');
  const [unit, setUnit] = useState<RateUnit>('hour');
  const [margin, setMargin] = useState('90');
  const [clients, setClients] = useState('1');
  const [burst, setBurst] = useState('10');

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    // Older share links carried the whole thing as one string ("1000/hour").
    const from = p.get('from');
    if (from) {
      const parsed = parseRateString(from);
      if (parsed) {
        setRequests(String(parsed.requests));
        setUnit(parsed.unit);
      }
    }
    if (p.get('margin')) setMargin(p.get('margin') as string);
    if (p.get('clients')) setClients(p.get('clients') as string);
    if (p.get('burst')) setBurst(p.get('burst') as string);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: `${requests}/${unit}`, margin, clients, burst });

  const result = useMemo(() => {
    const n = parseFloat(requests);
    if (isNaN(n) || n <= 0) return { data: null, error: 'Enter how many requests the limit allows' };

    const rate = rateFromParts(n, unit);
    const fraction = Math.min(100, Math.max(1, parseFloat(margin) || 100)) / 100;
    const clientCount = Math.max(1, Math.floor(parseFloat(clients) || 1));
    const burstSeconds = Math.max(1, parseFloat(burst) || 10);

    const target = marginRates(rate.perSecond, fraction);
    const bucket = tokenBucketParams(target.perSecond, burstSeconds);
    const each = perClientRates(target.perSecond, clientCount);
    const spacing = requestInterval(target.perSecond);

    return {
      data: {
        rate,
        fraction,
        clientCount,
        burstSeconds,
        target,
        bucket,
        each,
        spacing,
        backoff: backoffSchedule(Math.max(spacing, 1), 6, 300),
      },
      error: null,
    };
  }, [requests, unit, margin, clients, burst]);

  const data = result.data;
  const unitLabel = UNITS.find(u => u.value === unit)?.label ?? '';

  const periods = data
    ? ([
        { label: 'Per second', limit: data.rate.perSecond, target: data.target.perSecond },
        { label: 'Per minute', limit: data.rate.perMinute, target: data.target.perMinute },
        { label: 'Per hour', limit: data.rate.perHour, target: data.target.perHour },
        { label: 'Per day', limit: data.rate.perDay, target: data.target.perDay },
      ] as const)
    : [];

  return (
    <Panel
      title="API Rate Limit Calculator"
      description="Give it the published limit — say [1 1000 per hour 2] — and it works out the rate in every other period, the gap you need between requests to stay under it, token bucket settings, the share each client gets, and a retry schedule for when you hit a [1 429 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Requests</label>
              <input
                className={inputClass}
                inputMode="decimal"
                placeholder="1000"
                value={requests}
                onChange={e => setRequests(e.target.value)}
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Window</label>
              <select className={inputClass} value={unit} onChange={e => setUnit(e.target.value as RateUnit)}>
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Target Usage</label>
              <select className={inputClass} value={margin} onChange={e => setMargin(e.target.value)}>
                {MARGINS.map(m => (
                  <option key={m} value={String(m)}>
                    {m}% of the limit
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Clients</label>
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="1"
                value={clients}
                onChange={e => setClients(e.target.value)}
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>
                Burst <span className="normal-case font-normal text-gray-400">(sec)</span>
              </label>
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="10"
                value={burst}
                onChange={e => setBurst(e.target.value)}
              />
            </div>
          </div>

          {result.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{result.error}</div>
          )}

          {data && (
            <>
              {/* Headline */}
              <div className="bg-gray-900 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Send no faster than
                </p>
                <p className="text-4xl font-black text-white leading-none">
                  1 request every {humanDuration(data.spacing)}
                </p>
                <p className="text-sm text-gray-300 mt-2 font-mono">
                  {count(data.target.perSecond)} req/s &middot; {Math.round(data.fraction * 100)}% of {count(data.rate.requests)}{' '}
                  {unitLabel}
                </p>
              </div>

              {/* Equivalent rates */}
              <div>
                <p className={`${labelClass} mb-2`}>The Same Limit, Other Periods</p>
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className={`${labelClass} text-left px-3 py-2 font-bold`}>Window</th>
                        <th className={`${labelClass} text-right px-3 py-2 font-bold`}>Limit</th>
                        <th className={`${labelClass} text-right px-3 py-2 font-bold`}>
                          Target ({Math.round(data.fraction * 100)}%)
                        </th>
                        <th className={`${labelClass} text-right px-3 py-2 font-bold`}>Spare</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {periods.map(p => (
                        <tr key={p.label}>
                          <td className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                            {p.label.replace('Per ', '')}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-400 text-right">{count(p.limit)}</td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-900 text-right">{count(p.target)}</td>
                          <td className="px-3 py-2 font-mono text-xs text-gray-400 text-right">
                            {count(p.limit - p.target)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Min Spacing</p>
                  <p className="text-2xl font-black text-gray-900">{humanDuration(data.spacing)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">between requests</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Headroom</p>
                  <p className="text-2xl font-black text-gray-900">
                    {count(data.rate.requests - data.rate.requests * data.fraction)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">requests {unitLabel} spare</p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Per Client</p>
                  <p className="text-2xl font-black text-gray-900">{count(data.each.perSecond)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    req/s across {data.each.clients} client{data.each.clients === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="bg-white p-4">
                  <p className={`${labelClass} mb-1`}>Window Refill</p>
                  <p className="text-2xl font-black text-gray-900">{humanDuration(data.bucket.refillSeconds)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">to refill a full bucket</p>
                </div>
              </div>

              {/* Token bucket */}
              <div className="border border-gray-200 p-5">
                <p className={`${labelClass} mb-3`}>
                  Token Bucket{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (sized for a {count(data.burstSeconds)}-second burst)
                  </span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Capacity</p>
                    <p className="font-mono text-sm text-gray-900">{data.bucket.capacity} tokens</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Refill rate</p>
                    <p className="font-mono text-sm text-gray-900">{count(data.bucket.refillPerSecond)} tokens/s</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Max burst</p>
                    <p className="font-mono text-sm text-gray-900">{data.bucket.burstCapacity} requests</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  A client that has been idle can fire {data.bucket.burstCapacity} request
                  {data.bucket.burstCapacity === 1 ? '' : 's'} at once, then drops to{' '}
                  {count(data.bucket.refillPerSecond)} req/s. Refilling an empty bucket takes{' '}
                  {humanDuration(data.bucket.refillSeconds)}.
                </p>
              </div>

              {/* Per client */}
              {data.each.clients > 1 && (
                <div className="border border-gray-200 p-5">
                  <p className={`${labelClass} mb-3`}>
                    Split Across {data.each.clients} Clients{' '}
                    <span className="normal-case font-normal text-gray-400">(equal shares)</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Per second</p>
                      <p className="font-mono text-sm text-gray-900">{count(data.each.perSecond)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Per minute</p>
                      <p className="font-mono text-sm text-gray-900">{count(data.each.perMinute)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Per hour</p>
                      <p className="font-mono text-sm text-gray-900">{count(data.each.perHour)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Spacing</p>
                      <p className="font-mono text-sm text-gray-900">{humanDuration(data.each.intervalSeconds)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Backoff */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Retry Schedule{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (after a 429, doubling, capped at 5 min)
                  </span>
                </p>
                <div className="border border-gray-200 divide-y divide-gray-100">
                  {data.backoff.map(step => (
                    <div key={step.attempt} className="flex items-center gap-3 px-3 py-2">
                      <span className="font-mono text-xs text-gray-400 w-20 flex-shrink-0">retry {step.attempt}</span>
                      <div className="flex-1 h-4 bg-gray-100 min-w-0">
                        <div
                          className="h-full bg-gray-400"
                          style={{
                            width: `${(step.delaySeconds / data.backoff[data.backoff.length - 1].delaySeconds) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-gray-900 w-24 text-right flex-shrink-0">
                        wait {humanDuration(step.delaySeconds)}
                      </span>
                      <span className="font-mono text-xs text-gray-400 w-24 text-right flex-shrink-0 hidden sm:block">
                        {humanDuration(step.cumulativeSeconds)} total
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Honour the server&apos;s <span className="font-mono">Retry-After</span> header when it sends one. Add
                  jitter — pick a random wait between zero and the figure above — or every client that got throttled
                  together will retry together.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
