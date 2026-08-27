'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  analyzeBitfield,
  parseBitfieldInput,
  parseBitPositions,
  toggleBit,
  setBitsAt,
  clearBitsAt,
  toggleBitsAt,
  maskFor,
  BIT_WIDTHS,
  type BitWidth,
  type ByteBreakdown,
} from './logic';

const PRESETS: { label: string; value: string }[] = [
  { label: '255', value: '255' },
  { label: '0xFF00', value: '0xFF00' },
  { label: '0b1010', value: '0b1010' },
  { label: '0o755', value: '0o755' },
  { label: '-1', value: '-1' },
];

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {}
    );
  };

  return (
    <button
      onClick={copy}
      aria-label={`Copy ${text}`}
      className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
};

const ValueCard = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-gray-200 bg-gray-50 px-3 py-2 min-w-0">
    <div className="flex items-center justify-between gap-3 mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      <CopyButton text={value} />
    </div>
    <div className="font-mono text-sm text-gray-900 break-all">{value}</div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="border border-gray-200 px-3 py-2">
    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
    <div className="font-mono text-sm font-bold text-gray-900">{value}</div>
  </div>
);

const ByteGroup = ({
  byte,
  onToggleBit,
}: {
  byte: ByteBreakdown;
  onToggleBit: (position: number) => void;
}) => (
  <div className="border border-gray-200">
    <div className="flex items-baseline justify-between gap-3 border-b border-gray-200 bg-gray-50 px-2 py-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Byte {byte.index}
      </span>
      <span className="font-mono text-[10px] text-gray-400">
        {byte.highBit}–{byte.lowBit}
      </span>
    </div>

    <div className="flex gap-1 px-2 py-2">
      {byte.bits.map((bit, i) => {
        const position = byte.highBit - i;
        return (
          <button
            key={position}
            onClick={() => onToggleBit(position)}
            title={`Bit ${position} — click to toggle`}
            aria-label={`Bit ${position}, currently ${bit}`}
            aria-pressed={bit === 1}
            className={`flex flex-col items-center justify-center w-7 h-9 border font-mono text-sm font-bold transition-colors duration-150 cursor-pointer ${
              bit
                ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
            }`}
          >
            <span>{bit}</span>
            <span className="text-[8px] font-normal leading-none text-gray-400">{position}</span>
          </button>
        );
      })}
    </div>

    <div className="flex items-center justify-between gap-2 border-t border-gray-200 px-2 py-1 font-mono text-[11px]">
      <span className="text-gray-900">0x{byte.hex}</span>
      <span className="text-gray-500">{byte.value}</span>
      <span className="text-gray-400">{byte.char}</span>
    </div>
  </div>
);

export function BitfieldViewer() {
  const [input, setInput] = useState('255');
  const [width, setWidth] = useState<BitWidth>(32);
  const [positions, setPositions] = useState('');
  const [positionErr, setPositionErr] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
    const w = Number(p.get('width'));
    if (BIT_WIDTHS.includes(w as BitWidth)) setWidth(w as BitWidth);
  }, []);

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' };
    try {
      const { value, wrapped } = parseBitfieldInput(input, width);
      return { result: analyzeBitfield(value, width, wrapped), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input, width]);

  // Bit edits write back to the input box as hex so the field stays the source of truth.
  const applyValue = (value: bigint) => setInput(`0x${value.toString(16).toUpperCase()}`);

  const handleToggleBit = (position: number) => {
    if (!result) return;
    applyValue(toggleBit(result.value, position, width));
  };

  // Typing positions is the practical way to edit a wide field — hunting for bit
  // 37 among eight byte groups is painful, especially on a phone.
  const applyToPositions = (mode: 'set' | 'clear' | 'toggle') => {
    if (!result) return;
    try {
      const parsed = parseBitPositions(positions, width);
      const apply =
        mode === 'set' ? setBitsAt : mode === 'clear' ? clearBitsAt : toggleBitsAt;
      applyValue(apply(result.value, parsed, width));
      setPositionErr('');
    } catch (e) {
      setPositionErr((e as Error).message);
    }
  };

  const operations = result
    ? [
        { label: 'Invert', run: () => applyValue(~result.value & maskFor(width)) },
        { label: 'Shift ←', run: () => applyValue((result.value << BigInt(1)) & maskFor(width)) },
        { label: 'Shift →', run: () => applyValue(result.value >> BigInt(1)) },
        { label: 'Set all', run: () => applyValue(maskFor(width)) },
        { label: 'Clear', run: () => applyValue(BigInt(0)) },
      ]
    : [];

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm';

  return (
    <Panel
      title="Bitfield Viewer"
      description="Visualize a number as an [1 8/16/32/64-bit bitfield 2]. Enter a decimal like [1 255 2], hex like [1 0xFF 2], binary like [1 0b1010 2] or octal like [1 0o377 2] — then click any bit to flip it."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input + width selector */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className={inputClass}
                placeholder="255, 0xFF, 0b1010 or 0o377"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <div className="flex gap-1 flex-shrink-0">
                {BIT_WIDTHS.map(w => (
                  <button
                    key={w}
                    onClick={() => {
                      setWidth(w);
                      setPositionErr('');
                    }}
                    className={`px-3 py-2 text-xs font-bold transition-colors duration-150 cursor-pointer border ${
                      width === w
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {w}-bit
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Try
              </span>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setInput(p.value)}
                  className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-rose-700 text-sm font-mono">{error}</p>}

          {result?.wrapped && (
            <p className="text-xs text-gray-500 border border-amber-200 bg-amber-50 px-3 py-2">
              Value does not fit in {width} bits — showing the wrapped (two&apos;s complement) result.
            </p>
          )}

          {result && (
            <>
              {/* Representations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <ValueCard label="Decimal" value={result.dec} />
                <ValueCard label="Hex" value={result.hex} />
                <ValueCard label="Octal" value={result.oct} />
                <ValueCard label="Binary" value={result.bin} />
              </div>

              {/* Bit grid, grouped by byte */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {width}-bit field
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {operations.map(op => (
                      <button
                        key={op.label}
                        onClick={op.run}
                        className="text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {result.bytes.map(byte => (
                    <ByteGroup key={byte.index} byte={byte} onToggleBit={handleToggleBit} />
                  ))}
                </div>

                {/* Set / clear bits by position, for when tapping the grid is impractical */}
                <div className="flex flex-col gap-2 border border-gray-200 bg-gray-50 px-3 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Edit by position
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 flex-1 min-w-0 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm"
                      inputMode="numeric"
                      placeholder={`Position 0–${width - 1}, e.g. 0, 3, 7`}
                      value={positions}
                      onChange={e => {
                        setPositions(e.target.value);
                        setPositionErr('');
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') applyToPositions('set');
                      }}
                      aria-label={`Bit positions to edit, between 0 and ${width - 1}`}
                    />
                    <div className="flex gap-1 flex-shrink-0">
                      {(['set', 'clear', 'toggle'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => applyToPositions(mode)}
                          className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold capitalize border border-gray-200 bg-white text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  {positionErr && (
                    <p className="text-rose-700 text-xs font-mono">{positionErr}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                <Stat
                  label="Set bits"
                  value={<span className="text-emerald-700">{result.setBits}</span>}
                />
                <Stat label="Clear bits" value={result.clearBits} />
                <Stat
                  label="Highest set"
                  value={result.highestSetBit >= 0 ? result.highestSetBit : '—'}
                />
                <Stat
                  label="Lowest set"
                  value={result.lowestSetBit >= 0 ? result.lowestSetBit : '—'}
                />
                <Stat label="Signed" value={result.signedDec} />
              </div>

              {result.setPositions.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Set positions
                  </span>
                  <span className="font-mono text-xs text-gray-600 break-all">
                    {result.setPositions.join(', ')}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
