'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  ValueCard,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeFletcher,
  byteChar,
  parseInput,
  TRACE_LIMIT,
  type FletcherStep,
  type InputMode,
} from './logic';

const MODES: { id: InputMode; label: string; hint: string }[] = [
  { id: 'text', label: 'Text', hint: 'encoded as UTF-8' },
  { id: 'hex', label: 'Hex bytes', hint: 'e.g. 48 65 6C 6C 6F' },
];

const PRESETS: { label: string; value: { text: string; mode: InputMode } }[] = [
  { label: 'abcde', value: { text: 'abcde', mode: 'text' } },
  { label: 'Hello, World!', value: { text: 'Hello, World!', mode: 'text' } },
  { label: 'UTF-8', value: { text: 'naïve café €', mode: 'text' } },
  { label: 'Hex dump', value: { text: '48 65 6c 6c 6f 20 77 6f 72 6c 64', mode: 'hex' } },
  { label: 'All zeros', value: { text: '00 00 00 00 00 00 00 00', mode: 'hex' } },
];

/** How many trace rows to show before the user asks for the rest. */
const TRACE_PREVIEW = 32;

/**
 * The bits of a checksum, split at the boundary between the two accumulators.
 * The whole idea of Fletcher is that the result is just `sum2` concatenated
 * with `sum1`, so the split is drawn rather than described.
 */
const BitStrip = ({ value, width }: { value: number; width: 16 | 32 }) => {
  const bits = value.toString(2).padStart(width, '0').split('');
  const half = width / 2;

  return (
    <div className="flex flex-wrap gap-px">
      {bits.map((bit, i) => {
        const isHigh = i < half;
        const on = bit === '1';
        return (
          <span
            key={i}
            title={`bit ${width - 1 - i} — ${isHigh ? 'sum2' : 'sum1'}`}
            className={`w-4 h-5 flex items-center justify-center border font-mono text-[10px] leading-none ${
              on
                ? isHigh
                  ? 'bg-amber-200 border-amber-400 text-amber-900'
                  : 'bg-teal-200 border-teal-400 text-teal-900'
                : isHigh
                  ? 'bg-amber-50 border-amber-200 text-amber-300'
                  : 'bg-teal-50 border-teal-200 text-teal-300'
            }`}
          >
            {bit}
          </span>
        );
      })}
    </div>
  );
};

/** One accumulator: its value, how full it is against its modulus, its bits. */
const SumCard = ({
  name,
  role,
  value,
  modulus,
  hexWidth,
  tone,
}: {
  name: string;
  role: string;
  value: number;
  modulus: number;
  hexWidth: number;
  tone: 'high' | 'low';
}) => (
  <div
    className={`border px-3 py-2 min-w-0 ${
      tone === 'high' ? 'bg-amber-50 border-amber-200' : 'bg-teal-50 border-teal-200'
    }`}
  >
    <div className="flex items-baseline justify-between gap-2 mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">{name}</span>
      <span className="text-[10px] text-gray-500">{role}</span>
    </div>
    <div className="font-mono text-lg font-bold text-gray-900">
      0x{value.toString(16).toUpperCase().padStart(hexWidth, '0')}
      <span className="text-xs font-normal text-gray-500 ml-2">{value}</span>
    </div>
    <div className="mt-2">
      <Meter ratio={value / modulus} tone={tone === 'high' ? 'warn' : 'info'} />
      <div className="text-[10px] text-gray-500 mt-1 font-mono">mod {modulus}</div>
    </div>
  </div>
);

/** The checksum, its two halves, and the bit layout that joins them. */
const Composition = ({
  title,
  hex,
  decimal,
  sum1,
  sum2,
  modulus,
  width,
  note,
}: {
  title: string;
  hex: string;
  decimal: number;
  sum1: number;
  sum2: number;
  modulus: number;
  width: 16 | 32;
  note?: React.ReactNode;
}) => {
  const hexWidth = width / 8;
  const shift = width / 2;

  return (
    <div className="border border-gray-200 px-4 py-4 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{title}</span>
        <CopyButton text={`0x${hex}`} label={title} />
      </div>

      <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900 break-all">
        0x
        <span className="text-amber-700">{hex.slice(0, hexWidth)}</span>
        <span className="text-teal-700">{hex.slice(hexWidth)}</span>
      </div>
      <div className="font-mono text-xs text-gray-500">
        {decimal.toLocaleString('en-US')} decimal
      </div>

      <BitStrip value={decimal} width={width} />

      <div className="grid grid-cols-2 gap-2">
        {/* Each accumulator is half the checksum, so it takes half its hex digits. */}
        <SumCard
          name="sum2"
          role={`high ${shift} bits`}
          value={sum2}
          modulus={modulus}
          hexWidth={hexWidth}
          tone="high"
        />
        <SumCard
          name="sum1"
          role={`low ${shift} bits`}
          value={sum1}
          modulus={modulus}
          hexWidth={hexWidth}
          tone="low"
        />
      </div>

      <p className="font-mono text-[11px] text-gray-500 break-all">
        (sum2 &lt;&lt; {shift}) | sum1 = ({sum2} × {(2 ** shift).toLocaleString('en-US')}) + {sum1}
      </p>
      {note}
    </div>
  );
};

export const FletcherChecksum = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<InputMode>('text');
  const [traceAlgo, setTraceAlgo] = useState<'f16' | 'f32'>('f16');
  const [showAllSteps, setShowAllSteps] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    if (params.get('mode') === 'hex') setMode('hex');
  }, []);

  const parsed = useMemo(() => parseInput(input, mode), [input, mode]);
  const result = useMemo(() => analyzeFletcher(parsed.bytes), [parsed.bytes]);

  const hasBytes = result.byteCount > 0;

  const steps: FletcherStep[] = traceAlgo === 'f16' ? result.steps16 : result.steps32;
  const visibleSteps = showAllSteps ? steps : steps.slice(0, TRACE_PREVIEW);
  const stepModulus = traceAlgo === 'f16' ? 255 : 65535;
  const stepHexWidth = traceAlgo === 'f16' ? 2 : 4;

  const adlerA = result.adler32.decimal & 0xffff;
  const adlerB = result.adler32.decimal >>> 16;

  const pick = ({ text, mode: m }: { text: string; mode: InputMode }) => {
    setMode(m);
    setInput(text);
    setShowAllSteps(false);
  };

  return (
    <Panel
      title="Fletcher Checksum Calculator"
      description="Fletcher is a fast non-cryptographic checksum built from two running sums: [1 sum1 2] adds each word, [1 sum2 2] adds each sum1, and the checksum is the two concatenated. Used in [1 TCP 2], [1 SCTP 2] and [1 OSI IS-IS 2]. Feed it text or raw hex bytes — [1 abcde 2] should give Fletcher-16 [1 0xC8F0 2]."
      backColor="teal"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <SectionTitle
              note={
                parsed.error
                  ? undefined
                  : `${result.byteCount} byte${result.byteCount === 1 ? '' : 's'}${
                      hasBytes
                        ? ` · ${result.wordCount} word${result.wordCount === 1 ? '' : 's'}`
                        : ''
                    }`
              }
            >
              Input
            </SectionTitle>

            <div className="flex flex-wrap items-center gap-2">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`font-mono text-xs px-3 py-1.5 border transition-colors duration-150 cursor-pointer ${
                    mode === m.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              <span className="text-[11px] text-gray-400">
                {MODES.find(m => m.id === mode)?.hint}
              </span>
            </div>

            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-28 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
              spellCheck={false}
              placeholder={mode === 'hex' ? '48 65 6c 6c 6f' : 'abcde'}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                setShowAllSteps(false);
              }}
            />

            <PresetRow presets={PRESETS} onPick={pick} />
            {parsed.error && <ErrorNote>{parsed.error}</ErrorNote>}
          </div>

          {/* Headline checksums */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Composition
              title="Fletcher-16"
              hex={result.fletcher16.hex}
              decimal={result.fletcher16.decimal}
              sum1={result.fletcher16.sum1}
              sum2={result.fletcher16.sum2}
              modulus={255}
              width={16}
              note={
                <p className="text-[11px] text-gray-400">
                  Folds one byte at a time, modulo 255.
                </p>
              }
            />
            <Composition
              title="Fletcher-32"
              hex={result.fletcher32.hex}
              decimal={result.fletcher32.decimal}
              sum1={result.fletcher32.sum1}
              sum2={result.fletcher32.sum2}
              modulus={65535}
              width={32}
              note={
                <p className="text-[11px] text-gray-400">
                  Folds 16-bit words, modulo 65535.
                  {result.padded && ' Odd input — the last word was zero-padded.'}
                </p>
              }
            />
          </div>

          {/* Copyable values */}
          <div className="flex flex-col gap-2">
            <SectionTitle note="click copy to take a value away">Checksums</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <ValueCard label="Fletcher-16" value={`0x${result.fletcher16.hex}`} />
              <ValueCard label="Fletcher-32" value={`0x${result.fletcher32.hex}`} />
              <ValueCard label="Adler-32" value={`0x${result.adler32.hex}`} />
            </div>
          </div>

          {/* Input summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile
              label="Bytes"
              value={result.byteCount}
              hint={mode === 'hex' ? 'from hex input' : 'UTF-8 encoded'}
            />
            <StatTile
              label="16-bit words"
              value={result.wordCount}
              hint={result.padded ? 'last one zero-padded' : 'no padding needed'}
            />
            <StatTile
              label="Fletcher-16"
              value={`0x${result.fletcher16.hex}`}
              hint={String(result.fletcher16.decimal)}
            />
            <StatTile
              label="Fletcher-32"
              value={`0x${result.fletcher32.hex}`}
              hint={result.fletcher32.decimal.toLocaleString('en-US')}
            />
          </div>

          {/* Algorithm comparison */}
          <div className="flex flex-col gap-2">
            <SectionTitle note="same two-sum shape, different parameters">
              Compared with Adler-32
            </SectionTitle>
            <ResultTable
              headers={['Algorithm', 'Word', 'Modulus', 'Initial', 'Sum1', 'Sum2', 'Checksum']}
              align={['left', 'left', 'right', 'left', 'right', 'right', 'left']}
              rows={[
                [
                  'Fletcher-16',
                  '8-bit',
                  255,
                  '0, 0',
                  result.fletcher16.sum1,
                  result.fletcher16.sum2,
                  `0x${result.fletcher16.hex}`,
                ],
                [
                  'Fletcher-32',
                  '16-bit',
                  65535,
                  '0, 0',
                  result.fletcher32.sum1,
                  result.fletcher32.sum2,
                  `0x${result.fletcher32.hex}`,
                ],
                [
                  'Adler-32',
                  '8-bit',
                  65521,
                  '1, 0',
                  adlerA,
                  adlerB,
                  `0x${result.adler32.hex}`,
                ],
              ]}
            />
            <p className="text-[11px] text-gray-400">
              Adler-32 uses a prime modulus and starts sum1 at 1, so a run of leading zero
              bytes still changes its result — Fletcher, starting both sums at 0, does not.
            </p>
          </div>

          {/* Step-by-step accumulator trace */}
          {hasBytes && (
            <div className="flex flex-col gap-3">
              <SectionTitle
                note={
                  result.stepsTruncated
                    ? `first ${steps.length} of ${traceAlgo === 'f16' ? result.byteCount : result.wordCount} steps`
                    : `${steps.length} step${steps.length === 1 ? '' : 's'}`
                }
              >
                Accumulator trace
              </SectionTitle>

              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ['f16', 'Fletcher-16', `${result.steps16.length} bytes`],
                    ['f32', 'Fletcher-32', `${result.steps32.length} words`],
                  ] as const
                ).map(([id, label, count]) => (
                  <button
                    key={id}
                    onClick={() => {
                      setTraceAlgo(id);
                      setShowAllSteps(false);
                    }}
                    className={`font-mono text-xs px-3 py-1.5 border transition-colors duration-150 cursor-pointer ${
                      traceAlgo === id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                    }`}
                  >
                    {label} <span className="opacity-60">· {count}</span>
                  </button>
                ))}
              </div>

              <ResultTable
                headers={[
                  '#',
                  traceAlgo === 'f16' ? 'Byte' : 'Word',
                  traceAlgo === 'f16' ? 'Char' : 'Bytes',
                  'sum1',
                  'sum2',
                  'Running checksum',
                ]}
                align={['right', 'left', 'left', 'right', 'right', 'left']}
                rows={visibleSteps.map(step => {
                  const hi = step.value >>> 8;
                  const lo = step.value & 0xff;
                  return [
                    step.index,
                    <span key="v" className="text-gray-900">
                      0x{step.value.toString(16).toUpperCase().padStart(stepHexWidth, '0')}
                      <span className="text-gray-400 ml-2">{step.value}</span>
                    </span>,
                    <span key="c" className="text-gray-500">
                      {traceAlgo === 'f16'
                        ? byteChar(step.value)
                        : `${byteChar(hi)}${byteChar(lo)}`}
                    </span>,
                    step.sum1,
                    step.sum2,
                    <span key="r" className="text-gray-500">
                      0x
                      <span className="text-amber-700">
                        {step.sum2.toString(16).toUpperCase().padStart(stepHexWidth, '0')}
                      </span>
                      <span className="text-teal-700">
                        {step.sum1.toString(16).toUpperCase().padStart(stepHexWidth, '0')}
                      </span>
                    </span>,
                  ];
                })}
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-gray-400">
                  Every step is taken modulo {stepModulus.toLocaleString('en-US')}, which is why
                  the sums never grow past it.
                  {result.stepsTruncated &&
                    ` The trace stops at ${TRACE_LIMIT} steps — the checksums above still cover the whole input.`}
                </p>
                {steps.length > TRACE_PREVIEW && (
                  <button
                    onClick={() => setShowAllSteps(v => !v)}
                    className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                  >
                    {showAllSteps
                      ? `show first ${TRACE_PREVIEW}`
                      : `show all ${steps.length}`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Idle hint — the empty-input checksums above are correct, not a placeholder */}
          {!hasBytes && !parsed.error && (
            <div className="border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-3">
              <StatusBadge tone="neutral">no input</StatusBadge>
              <p className="text-sm text-gray-600">
                Those are the real checksums of an empty message — both Fletcher sums start
                at 0, while Adler-32 starts sum1 at 1. Type something to see the trace.
              </p>
            </div>
          )}
        </div>
      }
    />
  );
};
