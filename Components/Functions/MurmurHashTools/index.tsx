'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  ValueCard,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeMurmur,
  byteChar,
  MURMUR_CONSTANTS,
  parseInput,
  parseSeed,
  TRACE_LIMIT,
  type InputMode,
  type MurmurStep,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const MODES: { id: InputMode; label: string; hint: string }[] = [
  { id: 'text', label: 'Text', hint: 'encoded as UTF-8' },
  { id: 'hex', label: 'Hex bytes', hint: 'e.g. 48 65 6C 6C 6F' },
];

type Preset = { text: string; mode: InputMode; seed: string };

const PRESETS: { label: string; value: Preset }[] = [
  { label: 'Hello, World!', value: { text: 'Hello, World!', mode: 'text', seed: '0' } },
  { label: 'test', value: { text: 'test', mode: 'text', seed: '0' } },
  { label: 'SMHasher seed', value: { text: 'aaaa', mode: 'text', seed: '0x9747B28C' } },
  { label: 'UTF-8', value: { text: 'naïve café €', mode: 'text', seed: '0' } },
  { label: 'Hex dump', value: { text: '48 65 6c 6c 6f 20 77 6f 72 6c 64', mode: 'hex', seed: '0' } },
];

const SEED_PRESETS = ['0', '1', '42', '0x9747B28C'];

/** How many block rows to show before the user asks for the rest. */
const TRACE_PREVIEW = 32;

const hex32 = (n: number) => (n >>> 0).toString(16).toUpperCase().padStart(8, '0');
const hex8 = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');

/**
 * The 32 result bits, split into the four bytes they print as. MurmurHash3 has
 * no internal field structure to colour — the point of the strip is that a
 * one-character edit upstream repaints roughly half of it.
 */
const BitStrip = ({ binary, hex }: { binary: string; hex: string }) => (
  <div className="flex flex-wrap gap-3">
    {[0, 1, 2, 3].map(group => (
      <div key={group} className="flex flex-col gap-1">
        <div className="flex gap-px">
          {binary
            .slice(group * 8, group * 8 + 8)
            .split('')
            .map((bit, i) => {
              const bitIndex = 31 - (group * 8 + i);
              return (
                <span
                  key={i}
                  title={`bit ${bitIndex}`}
                  className={`w-4 h-5 flex items-center justify-center border font-mono text-[10px] leading-none ${
                    bit === '1'
                      ? 'bg-teal-200 border-teal-400 text-teal-900'
                      : 'bg-gray-50 border-gray-200 text-gray-400'
                  }`}
                >
                  {bit}
                </span>
              );
            })}
        </div>
        <div className="text-center font-mono text-[10px] text-gray-400">
          {hex.slice(group * 2, group * 2 + 2)}
        </div>
      </div>
    ))}
  </div>
);

/** Hex bytes with their printable characters underneath. */
const ByteCell = ({ bytes }: { bytes: number[] }) => (
  <span className="whitespace-nowrap">
    {bytes.map(b => hex8(b)).join(' ')}
    <span className="text-gray-400 ml-2">{bytes.map(byteChar).join('')}</span>
  </span>
);

const STAGE_TEXT: Record<MurmurStep['stage'], string> = {
  seed: 'text-gray-400',
  block: 'text-gray-900',
  tail: 'text-amber-700',
  final: 'text-indigo-700',
};

export const MurmurHashCalculator = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<InputMode>('text');
  const [seedText, setSeedText] = useState('0');
  const [showAllSteps, setShowAllSteps] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    if (params.get('mode') === 'hex') setMode('hex');
    const seed = params.get('seed');
    if (seed) setSeedText(seed);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input, mode, seed: seedText })

  const parsed = useMemo(() => parseInput(input, mode), [input, mode]);
  const seed = useMemo(() => parseSeed(seedText), [seedText]);
  const result = useMemo(() => analyzeMurmur(parsed.bytes, seed.seed), [parsed.bytes, seed.seed]);

  const hasBytes = result.byteCount > 0;

  const blockSteps = result.steps.filter(s => s.stage === 'block');
  const shownBlocks = showAllSteps ? blockSteps.length : Math.min(blockSteps.length, TRACE_PREVIEW);
  // Blocks missing from the table, whether hidden by the preview or dropped by TRACE_LIMIT.
  const skippedBlocks = result.blockCount - shownBlocks;

  const traceSteps: (MurmurStep | 'gap')[] = [
    ...result.steps.filter(s => s.stage === 'seed'),
    ...blockSteps.slice(0, shownBlocks),
    ...(skippedBlocks > 0 ? (['gap'] as const) : []),
    ...result.steps.filter(s => s.stage === 'tail' || s.stage === 'final'),
  ];

  const pick = ({ text, mode: m, seed: s }: Preset) => {
    setMode(m);
    setInput(text);
    setSeedText(s);
    setShowAllSteps(false);
  };

  return (
    <Panel
      title="MurmurHash3 Calculator"
      description="MurmurHash3 (32-bit) is a fast non-cryptographic hash built from two stages: each 4-byte block is mixed into an accumulator [1 h1 2], then a finalizer avalanches the result so one changed bit rewrites half the output. Used for [1 hash tables 2] and [1 bloom filters 2]. The [1 seed 2] picks an independent hash function — [1 test 2] with seed 0 gives [1 0xBA6BD213 2]."
      backColor="teal"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <SectionTitle
              note={
                parsed.error
                  ? undefined
                  : `${result.byteCount} byte${result.byteCount === 1 ? '' : 's'} · ${
                      result.blockCount
                    } block${result.blockCount === 1 ? '' : 's'} + ${result.tailLength} tail`
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

            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-28 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
                spellCheck={false}
                placeholder={mode === 'hex' ? '48 65 6c 6c 6f' : 'Hello, World!'}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  setShowAllSteps(false);
                }}
              />
            </FileTextArea>

            <PresetRow presets={PRESETS} onPick={pick} />
            {parsed.error && <ErrorNote>{parsed.error}</ErrorNote>}
          </div>

          {/* Seed */}
          <div className="flex flex-col gap-2">
            <SectionTitle note="decimal or 0x-prefixed hex, 32-bit">Seed</SectionTitle>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                spellCheck={false}
                className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-1.5 w-40 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm"
                value={seedText}
                placeholder="0"
                onChange={e => setSeedText(e.target.value)}
              />
              {SEED_PRESETS.map(s => (
                <button
                  key={s}
                  onClick={() => setSeedText(s)}
                  className={`font-mono text-xs px-2 py-1 border transition-colors duration-150 cursor-pointer ${
                    seedText === s
                      ? 'border-gray-900 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  {s}
                </button>
              ))}
              <span className="font-mono text-[11px] text-gray-400">
                = {seed.seed} / 0x{hex32(seed.seed)}
              </span>
            </div>
            {seed.error && <ErrorNote>{seed.error}</ErrorNote>}
          </div>

          {/* Headline hash */}
          <div className="border border-gray-200 bg-gray-50 px-4 py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                MurmurHash3 · 32-bit
              </span>
              <CopyButton text={`0x${result.hex}`} label="hash" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900 break-all">
              0x{result.hex}
            </div>
            <div className="font-mono text-xs text-gray-500">
              {Number(result.decimal).toLocaleString('en-US')} unsigned ·{' '}
              {result.signed.toLocaleString('en-US')} signed
            </div>
            <BitStrip binary={result.binary} hex={result.hex} />
          </div>

          {/* Copyable values */}
          <div className="flex flex-col gap-2">
            <SectionTitle note="click copy to take a value away">Representations</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <ValueCard label="Hex" value={`0x${result.hex}`} />
              <ValueCard label="Decimal (unsigned)" value={result.decimal} />
              <ValueCard label="Signed int32" value={String(result.signed)} />
              <ValueCard label="Binary" value={result.binary} />
            </div>
            <p className="text-[11px] text-gray-400">
              Implementations disagree on signedness, not on the bits — Java&apos;s
              <span className="font-mono"> murmur3_32 </span>
              returns the signed reading of the same 32 bits.
            </p>
          </div>

          {/* Input summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile
              label="Bytes"
              value={result.byteCount}
              hint={mode === 'hex' ? 'from hex input' : 'UTF-8 encoded'}
            />
            <StatTile
              label="4-byte blocks"
              value={result.blockCount}
              hint="fully mixed rounds"
            />
            <StatTile
              label="Tail bytes"
              value={result.tailLength}
              hint={result.tailLength === 0 ? 'exact multiple of 4' : 'no h1 rotation'}
            />
            <StatTile label="Seed" value={`0x${hex32(result.seed)}`} hint={String(result.seed)} />
          </div>

          {/* Mixing trace */}
          <div className="flex flex-col gap-3">
            <SectionTitle
              note={
                skippedBlocks > 0
                  ? `${shownBlocks} of ${result.blockCount} blocks shown`
                  : `${result.steps.length} step${result.steps.length === 1 ? '' : 's'}`
              }
            >
              Mixing trace
            </SectionTitle>

            <ResultTable
              headers={['Stage', 'Bytes', 'k1', 'h1']}
              align={['left', 'left', 'left', 'left']}
              rows={traceSteps.map(step =>
                step === 'gap'
                  ? [
                      <span key="g" className="text-gray-400">
                        …
                      </span>,
                      <span key="n" className="text-gray-400">
                        {skippedBlocks} block{skippedBlocks === 1 ? '' : 's'} not shown
                      </span>,
                      '',
                      '',
                    ]
                  : [
                      <span key="s" className={`font-bold ${STAGE_TEXT[step.stage]}`}>
                        {step.label}
                      </span>,
                      step.bytes.length > 0 ? (
                        <ByteCell key="b" bytes={step.bytes} />
                      ) : (
                        <span key="b" className="text-gray-400">
                          —
                        </span>
                      ),
                      step.k1Mixed === null ? (
                        <span key="k" className="text-gray-400">
                          —
                        </span>
                      ) : (
                        <span key="k" className="whitespace-nowrap">
                          0x{hex32(step.k1Mixed)}
                          <span className="text-gray-400 ml-2">
                            from 0x{hex32(step.k1Raw ?? 0)}
                          </span>
                        </span>
                      ),
                      <span key="h" className="text-gray-900">
                        0x{hex32(step.h1)}
                      </span>,
                    ]
              )}
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] text-gray-400">
                Each block mixes k1 (×c1, rotl 15, ×c2), XORs it into h1, then rotates and
                scrambles h1. The tail skips that rotation, and the six finalization steps run
                once at the end — that last group is what turns a near-collision into an
                unrelated number.
                {result.omittedBlocks > 0 &&
                  ` The trace records at most ${TRACE_LIMIT} blocks, but the hash above covers the whole input.`}
              </p>
              {blockSteps.length > TRACE_PREVIEW && (
                <button
                  onClick={() => setShowAllSteps(v => !v)}
                  className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                >
                  {showAllSteps
                    ? `show first ${TRACE_PREVIEW} blocks`
                    : `show all ${blockSteps.length} blocks`}
                </button>
              )}
            </div>
          </div>

          {/* Constants */}
          <div className="flex flex-col gap-2">
            <SectionTitle note="the magic numbers in the trace">Constants</SectionTitle>
            <ResultTable
              headers={['Name', 'Value', 'Used for']}
              rows={MURMUR_CONSTANTS.map(c => [c.name, c.value, c.role])}
            />
          </div>

          {/* Idle hint — an empty message really does hash to the seed's avalanche */}
          {!hasBytes && !parsed.error && (
            <div className="border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-3">
              <StatusBadge tone="neutral">no input</StatusBadge>
              <p className="text-sm text-gray-600">
                That is the real hash of an empty message — with seed 0 it is exactly
                <span className="font-mono"> 0x00000000</span>, because the finalizer has
                nothing but zeros to avalanche. Type something to fill the trace.
              </p>
            </div>
          )}

          <div className="border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap items-center gap-3">
            <StatusBadge tone="warn">not cryptographic</StatusBadge>
            <p className="text-sm text-gray-600">
              MurmurHash3 is built for speed and distribution, not for security. It is not
              collision-resistant against an attacker who picks the input — never use it for
              passwords, signatures, or integrity checks.
            </p>
          </div>
        </div>
      }
    />
  );
};
