'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  calculatePacketSize,
  formatBytes,
  PROTOCOL_STACKS,
  STANDARD_MTUS,
  type PacketResult,
} from './logic';

export const PacketSizeCalculator = () => {
  const [payloadStr, setPayloadStr] = useState('1000');
  const [stack, setStack] = useState('TCP/IPv4/Ethernet');
  const [mtuKey, setMtuKey] = useState('Ethernet (standard)');
  const [customMtu, setCustomMtu] = useState('');
  const [result, setResult] = useState<PacketResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setPayloadStr(from);
  }, []);

  useEffect(() => {
    try {
      const payload = parseInt(payloadStr, 10);
      if (isNaN(payload) || payload < 0) throw new Error('Enter a valid non-negative number');
      const protocols = PROTOCOL_STACKS[stack];
      const mtu = customMtu ? parseInt(customMtu, 10) : STANDARD_MTUS[mtuKey];
      if (isNaN(mtu) || mtu < 1) throw new Error('Invalid MTU');
      setResult(calculatePacketSize(payload, protocols, mtu));
      setError('');
    } catch (e: unknown) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Calculation error');
    }
  }, [payloadStr, stack, mtuKey, customMtu]);

  const inputClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-2.5 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 text-sm font-mono';
  const selectClass =
    'bg-white text-gray-200 border border-gray-200 px-3 py-2.5 text-sm focus:outline-none w-full';
  const labelClass = 'text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 block';

  return (
    <Panel
      title="Packet Size Calculator"
      description="Calculate total network packet sizes including protocol headers. Analyze MTU fragmentation for different payload sizes and protocol stacks."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Payload Size (bytes)</label>
              <input
                className={inputClass}
                value={payloadStr}
                onChange={e => setPayloadStr(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className={labelClass}>Protocol Stack</label>
              <select className={selectClass} value={stack} onChange={e => setStack(e.target.value)}>
                {Object.keys(PROTOCOL_STACKS).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>MTU Preset</label>
              <select className={selectClass} value={mtuKey} onChange={e => { setMtuKey(e.target.value); setCustomMtu(''); }}>
                {Object.keys(STANDARD_MTUS).map(k => (
                  <option key={k} value={k}>{k} ({STANDARD_MTUS[k]} B)</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Custom MTU (bytes, overrides preset)</label>
              <input
                className={inputClass}
                value={customMtu}
                onChange={e => setCustomMtu(e.target.value)}
                placeholder="e.g. 1500"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

          {result && (
            <div className="flex flex-col gap-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Payload', formatBytes(result.payloadSize)],
                  ['Total Size', formatBytes(result.totalSize)],
                  ['Header Overhead', formatBytes(result.overhead)],
                  ['Efficiency', result.efficiency + '%'],
                ].map(([label, value]) => (
                  <div key={label} className="border border-gray-200 bg-gray-50 p-3 flex flex-col gap-1">
                    <p className="text-gray-500 text-xs">{label}</p>
                    <p className="text-sky-300 font-mono text-sm font-bold">{value}</p>
                  </div>
                ))}
              </div>

              {/* Header breakdown */}
              <div>
                <p className="text-sky-400 text-xs font-semibold uppercase tracking-wider mb-2">Header Breakdown</p>
                <div className="flex flex-col gap-1">
                  {result.headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm border-b border-gray-200 py-1.5">
                      <span className="text-gray-900 font-mono w-32 shrink-0">{h.protocol}</span>
                      <span className="text-sky-300 font-mono w-12 shrink-0">{h.size} B</span>
                      <span className="text-gray-500 text-xs">{h.description}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-sm py-1.5 font-semibold">
                    <span className="text-gray-400 font-mono w-32 shrink-0">Payload</span>
                    <span className="text-gray-300 font-mono w-12 shrink-0">{result.payloadSize} B</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm py-1.5 border-t border-gray-200 font-semibold">
                    <span className="text-gray-900 font-mono w-32 shrink-0">Total</span>
                    <span className="text-gray-900 font-mono w-12 shrink-0">{result.totalSize} B</span>
                  </div>
                </div>
              </div>

              {/* MTU Analysis */}
              <div>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  MTU Analysis (MTU = {result.mtuBytes} B)
                </p>
                {result.totalSize <= result.mtuBytes ? (
                  <p className="text-emerald-400 text-sm">
                    Packet fits within MTU — no fragmentation needed.
                  </p>
                ) : (
                  <>
                    <p className="text-amber-300 text-sm mb-2">
                      Packet exceeds MTU by {result.totalSize - result.mtuBytes} bytes.
                      Requires <strong>{result.packetsNeeded}</strong> fragments
                      (~{result.perPacketPayload} B payload each).
                    </p>
                    {result.fragments.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="border-b border-gray-200 text-gray-500">
                              <th className="py-1.5 pr-4 text-left font-normal">Frag #</th>
                              <th className="py-1.5 pr-4 text-left font-normal">Payload B</th>
                              <th className="py-1.5 pr-4 text-left font-normal">Total B</th>
                              <th className="py-1.5 text-left font-normal">Offset</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.fragments.map(f => (
                              <tr key={f.fragmentNumber} className="border-b border-gray-200">
                                <td className="py-1 pr-4 text-gray-300">{f.fragmentNumber}</td>
                                <td className="py-1 pr-4 text-sky-300">{f.payloadBytes}</td>
                                <td className="py-1 pr-4 text-gray-300">{f.totalBytes}</td>
                                <td className="py-1 text-gray-500">{f.offset}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.fragments.length === 20 && (
                          <p className="text-gray-600 text-xs mt-1">(showing first 20 fragments)</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};
