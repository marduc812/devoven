'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { convertNtp, NTP_UNIX_OFFSET } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export function NtpTimeCalculator() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInput(from);
    else {
      const nowUnix = Math.floor(Date.now() / 1000);
      setInput(String(nowUnix + NTP_UNIX_OFFSET));
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { data: convertNtp(input), error: null };
    } catch (e: unknown) {
      return { data: null, error: e instanceof Error ? e.message : 'Invalid input' };
    }
  }, [input]);

  const data = result?.data ?? null;
  const error = result?.error ?? null;

  return (
    <Panel
      title="NTP Time Calculator"
      description="Convert between NTP timestamps (seconds since [1 1900-01-01 2]) and Unix timestamps (seconds since [1 1970-01-01 2]). Shows NTP short (32-bit) and long (64-bit) hex formats."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NTP or Unix Timestamp</label>
            <input
              className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm"
              placeholder="e.g. 3913935677 (NTP) or 1704946877 (Unix)"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            {data && (
              <p className="text-xs text-gray-400 mt-1">
                Detected as: <span className="font-bold text-gray-600">{data.isNtp ? 'NTP timestamp' : 'Unix timestamp'}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">{error}</div>
          )}

          {data && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NTP Timestamp</p>
                  <p className="text-xl font-black text-gray-900 font-mono">{data.ntpTimestamp.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">seconds since 1900-01-01</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Unix Timestamp</p>
                  <p className="text-xl font-black text-gray-900 font-mono">{data.unixTimestamp.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">seconds since 1970-01-01</p>
                </div>
              </div>

              {/* UTC Date/Time */}
              <div className="border border-gray-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">UTC Date / Time</p>
                <p className="text-lg font-black text-gray-900">{data.utcString}</p>
              </div>

              {/* Details table */}
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['NTP Short (32-bit)', data.ntpShort],
                      ['NTP Long (64-bit)', data.ntpLong],
                      ['NTP Era', `${data.era} (Era 0 = 1900 – 2036)`],
                      ['Epoch Difference', `${data.epochDiff.toLocaleString()} seconds (70 years)`],
                    ].map(([label, value], i) => (
                      <tr
                        key={label}
                        className={`${i > 0 ? 'border-t border-gray-200' : ''} cursor-pointer hover:bg-gray-50`}
                        onClick={() => copy(value)}
                        title="Click to copy"
                      >
                        <td className="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider w-44">{label}</td>
                        <td className="px-4 py-2 text-gray-900 text-sm font-mono">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Epoch info */}
              <div className="grid grid-cols-2 gap-px bg-gray-200">
                <div className="bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">NTP Epoch</p>
                  <p className="text-sm font-mono text-gray-900">1900-01-01 00:00:00 UTC</p>
                </div>
                <div className="bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Unix Epoch</p>
                  <p className="text-sm font-mono text-gray-900">1970-01-01 00:00:00 UTC</p>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
