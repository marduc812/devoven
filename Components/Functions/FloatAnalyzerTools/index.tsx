'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  ValueCard,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzeFloat, type FloatPrecision } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: '0.1', value: '0.1' },
  { label: '1', value: '1' },
  { label: '-0.5', value: '-0.5' },
  { label: '3.14159', value: '3.14159' },
  { label: '1e-45', value: '1e-45' },
  { label: 'Infinity', value: 'Infinity' },
  { label: 'NaN', value: 'NaN' },
];

/** Binary string → hex, four bits at a time. */
function binaryToHex(binary: string): string {
  let hex = '';
  for (let i = 0; i < binary.length; i += 4) {
    hex += parseInt(binary.slice(i, i + 4), 2).toString(16).toUpperCase();
  }
  return `0x${hex}`;
}

const SEGMENTS = [
  { key: 'sign', label: 'Sign', className: 'bg-rose-100 border-rose-300 text-rose-900' },
  { key: 'exponent', label: 'Exponent', className: 'bg-amber-100 border-amber-300 text-amber-900' },
  {
    key: 'mantissa',
    label: 'Mantissa',
    className: 'bg-indigo-100 border-indigo-300 text-indigo-900',
  },
] as const;

/** The full bit field, colour-coded by IEEE 754 segment. */
const BitField = ({ fp }: { fp: FloatPrecision }) => {
  const groups = [
    { ...SEGMENTS[0], bits: fp.fullBinary.slice(0, 1), start: fp.bits - 1 },
    {
      ...SEGMENTS[1],
      bits: fp.fullBinary.slice(1, 1 + fp.exponentBits),
      start: fp.bits - 2,
    },
    {
      ...SEGMENTS[2],
      bits: fp.fullBinary.slice(1 + fp.exponentBits),
      start: fp.mantissaBits - 1,
    },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {groups.map(g => (
        <div key={g.key} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {g.label}
            </span>
            <span className="font-mono text-[10px] text-gray-400">
              {g.bits.length} bit{g.bits.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="flex flex-wrap gap-px">
            {g.bits.split('').map((bit, i) => (
              <span
                key={i}
                title={`Bit ${g.start - i}`}
                className={`w-4 h-6 flex items-center justify-center border font-mono text-[11px] ${
                  bit === '1' ? `${g.className} font-bold` : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                {bit}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PrecisionCard = ({ fp }: { fp: FloatPrecision }) => {
  const exact = fp.isSpecial
    ? fp.specialName
    : isNaN(fp.exactValue)
      ? 'NaN'
      : fp.exactValue.toPrecision(17);

  return (
    <div className="border border-gray-200 flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <span className="font-bold text-sm text-gray-900">
          {fp.label} <span className="font-normal text-gray-400">({fp.bits}-bit)</span>
        </span>
        {fp.isSpecial ? (
          <StatusBadge tone="warn">{fp.specialName}</StatusBadge>
        ) : fp.roundingError === 0 ? (
          <StatusBadge tone="pass">exact</StatusBadge>
        ) : (
          <StatusBadge tone="warn">rounded</StatusBadge>
        )}
      </div>

      <div className="px-3 py-3 flex flex-col gap-4">
        <BitField fp={fp} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ValueCard label="Hex" value={binaryToHex(fp.fullBinary)} />
          <ValueCard label="Binary" value={fp.fullBinary} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatTile label="Sign" value={fp.sign} hint={fp.sign === 0 ? 'positive' : 'negative'} />
          <StatTile label="Stored exp" value={fp.storedExponent} hint={fp.exponentBinary} />
          <StatTile label="Actual exp" value={fp.unbiasedExponent} hint={`stored − ${fp.bias}`} />
          <StatTile label="Bias" value={fp.bias} hint={`${fp.exponentBits} exponent bits`} />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Exact stored value
            </span>
            {!fp.isSpecial && <CopyButton text={exact} label="exact value" />}
          </div>
          <div className="font-mono text-sm text-gray-900 break-all">{exact}</div>
          {!fp.isSpecial && (
            <div className="font-mono text-[11px] text-gray-400">
              {fp.roundingError === 0
                ? 'represented exactly — no rounding error'
                : `rounding error ${fp.roundingError.toExponential(6)}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function FloatAnalyzer() {
  const [input, setInput] = useState('0.1');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = useMemo(() => (input.trim() ? analyzeFloat(input) : null), [input]);

  const invalid = input.trim() !== '' && result === null;

  return (
    <Panel
      title="IEEE 754 Float Analyzer"
      description="See how a decimal number is actually stored in floating point. The bit field is split into [1 sign 2], [1 exponent 2] and [1 mantissa 2] for both [1 32-bit 2] and [1 64-bit 2] precision, with the exact stored value and its rounding error."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <input
              className={inputClass}
              placeholder="0.1, -3.14, 1e-45, Infinity or NaN"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {invalid && (
            <ErrorNote>
              Invalid number. Enter a decimal number, or one of: NaN, Infinity, -Infinity
            </ErrorNote>
          )}

          {result && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile label="Input" value={String(result.input)} />
                <StatTile
                  label="Classification"
                  value={
                    result.isNaN ? (
                      <StatusBadge tone="warn">NaN</StatusBadge>
                    ) : result.isInfinity ? (
                      <StatusBadge tone="warn">Infinity</StatusBadge>
                    ) : (
                      <StatusBadge tone="pass">finite</StatusBadge>
                    )
                  }
                />
                <StatTile
                  label="Denormal (32-bit)"
                  value={result.isDenormal32 ? 'Yes' : 'No'}
                  hint={result.isDenormal32 ? 'below the normal range' : undefined}
                />
                <StatTile
                  label="Denormal (64-bit)"
                  value={result.isDenormal64 ? 'Yes' : 'No'}
                  hint={result.isDenormal64 ? 'below the normal range' : undefined}
                />
              </div>

              <div className="flex flex-col gap-3">
                <SectionTitle note="bits run most-significant first; 0 bits are dimmed">
                  Representations
                </SectionTitle>
                <div className="flex flex-wrap gap-3">
                  {SEGMENTS.map(s => (
                    <span key={s.key} className="flex items-center gap-1 text-[10px] text-gray-400">
                      <span className={`w-3 h-3 border ${s.className}`} /> {s.label}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                  <PrecisionCard fp={result.single} />
                  <PrecisionCard fp={result.double} />
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
