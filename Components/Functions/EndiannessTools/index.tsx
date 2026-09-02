'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { byteAscii, convertEndianness, type BitWidth } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

/**
 * Each byte keeps its colour in both rows, so the reversal reads as the same
 * bytes in a different order rather than as two unrelated values. Both the tint
 * and the text colour are set inline, which keeps them legible in either theme.
 */
const BYTE_TINTS = [
  '#dbeafe',
  '#d1fae5',
  '#fef3c7',
  '#fce7f3',
  '#e0e7ff',
  '#ccfbf1',
  '#ffedd5',
  '#ede9fe',
];

function ByteBox({
  byte,
  tint,
  address,
  caption,
}: {
  byte: string;
  tint: string;
  address: number;
  caption: string;
}) {
  return (
    <div className="flex-1 min-w-[52px]">
      <div
        className="px-2 py-3 text-center font-mono text-base font-bold border border-gray-300"
        style={{ backgroundColor: tint, color: '#111827' }}
      >
        {byte}
      </div>
      <p className="text-[10px] font-mono text-gray-400 text-center mt-1">+{address}</p>
      <p className="text-[10px] font-mono text-gray-400 text-center">{caption}</p>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <button
      onClick={() => copy(value)}
      title="Click to copy"
      className="bg-white p-4 text-left hover:bg-gray-50 transition-colors"
    >
      <p className={`${labelClass} mb-1`}>{label}</p>
      <p className="text-xl font-black text-gray-900 font-mono break-all leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </button>
  );
}

export function EndiannessConverter() {
  const [input, setInput] = useState('DEADBEEF');
  const [bitWidth, setBitWidth] = useState<BitWidth>(32);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
    const bits = p.get('bits');
    if (bits === '16' || bits === '32' || bits === '64') setBitWidth(Number(bits) as BitWidth);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input, bits: bitWidth })

  const result = useMemo(() => {
    if (!input.trim()) {
      return { data: null, error: 'Enter a hex value, for example DEADBEEF' };
    }
    const r = convertEndianness(input, bitWidth);
    return r.error ? { data: null, error: r.error } : { data: r, error: null as string | null };
  }, [input, bitWidth]);

  const data = result.data;
  const byteCount = bitWidth / 8;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  // Big-endian byte i sits at index (n-1-i) once reversed, so the tint follows it across.
  const tintFor = (indexInBE: number) => BYTE_TINTS[indexInBE % BYTE_TINTS.length];

  return (
    <Panel
      title="Endianness Converter"
      description="Paste a hex value such as [1 0x12345678 2] or [1 DEADBEEF 2] and see the bytes laid out in memory both ways. Shows what the same bytes are worth read big-endian and little-endian, signed and unsigned, at 16, 32 or 64 bits."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Hex Value</label>
              <input
                className={inputClass}
                placeholder="DEADBEEF"
                value={input}
                onChange={e => setInput(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Width</label>
              <div className="flex gap-1">
                {([16, 32, 64] as BitWidth[]).map(w => (
                  <button
                    key={w}
                    onClick={() => setBitWidth(w)}
                    className={`flex-1 px-2 py-2 text-xs font-mono border transition-colors ${
                      bitWidth === w
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                    }`}
                  >
                    {w}-bit
                  </button>
                ))}
              </div>
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
              <div className="bg-gray-900 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Big-Endian
                  </p>
                  <p className="text-3xl font-black text-white leading-none font-mono break-all">
                    0x{data.bigEndianHex}
                  </p>
                  <p className="text-xs text-gray-300 mt-2 font-mono">
                    = {data.decimal} unsigned
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                    Little-Endian
                  </p>
                  <p className="text-3xl font-black text-white leading-none font-mono break-all">
                    0x{data.littleEndianHex}
                  </p>
                  <p className="text-xs text-gray-300 mt-2 font-mono">
                    = {data.decimalSwapped} unsigned
                  </p>
                </div>
              </div>

              {/* Memory layout */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Memory Layout{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (addresses increase to the right; matching colours are the same byte)
                  </span>
                </p>
                <div className="border border-gray-200 p-4 flex flex-col gap-5 overflow-x-auto">
                  <div className="min-w-[320px]">
                    <p className="text-[11px] font-mono text-gray-500 mb-2">
                      Big-endian — most significant byte first
                    </p>
                    <div className="flex gap-1">
                      {data.bytesBigEndian.map((b, i) => (
                        <ByteBox
                          key={i}
                          byte={b}
                          tint={tintFor(i)}
                          address={i}
                          caption={i === 0 ? 'MSB' : i === byteCount - 1 ? 'LSB' : ''}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="min-w-[320px]">
                    <p className="text-[11px] font-mono text-gray-500 mb-2">
                      Little-endian — least significant byte first
                    </p>
                    <div className="flex gap-1">
                      {data.bytesLittleEndian.map((b, i) => (
                        <ByteBox
                          key={i}
                          byte={b}
                          tint={tintFor(byteCount - 1 - i)}
                          address={i}
                          caption={i === 0 ? 'LSB' : i === byteCount - 1 ? 'MSB' : ''}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
                <Stat
                  label="Unsigned"
                  value={data.decimal}
                  hint={`big-endian, ${bitWidth}-bit`}
                />
                <Stat
                  label="Signed"
                  value={data.decimalSigned}
                  hint="two's complement"
                />
                <Stat
                  label="Byte-Swapped"
                  value={data.decimalSwapped}
                  hint="same bytes read the other way"
                />
              </div>

              {/* Binary */}
              <div className="border border-gray-200 p-4">
                <p className={`${labelClass} mb-2`}>Bits</p>
                <p className="font-mono text-sm text-gray-900 break-all leading-relaxed">
                  {(data.binary.match(/.{1,8}/g) ?? []).map((octet, i) => (
                    <span
                      key={i}
                      className="inline-block mr-2 px-1"
                      style={{ backgroundColor: tintFor(i), color: '#111827' }}
                    >
                      {octet}
                    </span>
                  ))}
                </p>
              </div>

              {/* Per-byte table */}
              <div>
                <p className={`${labelClass} mb-2`}>Byte Detail</p>
                <div className="border border-gray-200 overflow-x-auto">
                  <table className="w-full min-w-[420px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className={`${labelClass} text-left px-3 py-2`}>Offset</th>
                        <th className={`${labelClass} text-left px-3 py-2`}>Hex</th>
                        <th className={`${labelClass} text-left px-3 py-2`}>Dec</th>
                        <th className={`${labelClass} text-left px-3 py-2`}>Binary</th>
                        <th className={`${labelClass} text-left px-3 py-2`}>ASCII</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bytesBigEndian.map((b, i) => (
                        <tr key={i} className="border-t border-gray-200">
                          <td className="px-3 py-2 font-mono text-xs text-gray-500">
                            <span
                              className="inline-block w-2 h-2 mr-2 align-middle"
                              style={{ backgroundColor: tintFor(i) }}
                            />
                            +{i}
                          </td>
                          <td className="px-3 py-2 font-mono text-sm font-bold text-gray-900">
                            0x{b}
                          </td>
                          <td className="px-3 py-2 font-mono text-sm text-gray-500">
                            {parseInt(b, 16)}
                          </td>
                          <td className="px-3 py-2 font-mono text-sm text-gray-500">
                            {parseInt(b, 16).toString(2).padStart(8, '0')}
                          </td>
                          <td className="px-3 py-2 font-mono text-sm text-gray-500">
                            {byteAscii(b)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  Offsets are big-endian positions; little-endian stores them in the reverse order.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
