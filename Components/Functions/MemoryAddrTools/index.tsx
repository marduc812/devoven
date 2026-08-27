'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  calculateAddress,
  calculateDistance,
  humanBytes,
  type AlignmentInfo,
  type PageInfo,
} from './logic';

type Mode = 'calculate' | 'distance';

const MODES: { id: Mode; label: string }[] = [
  { id: 'calculate', label: 'Base + Offset' },
  { id: 'distance', label: 'Address Distance' },
];

const CALC_PRESETS = [
  { label: '0x1000 + 0x100', base: '0x1000', offset: '0x100' },
  { label: '0x7FFF0000 + 4096', base: '0x7FFF0000', offset: '4096' },
  { label: '0xDEAD0000 + 0x1F', base: '0xDEAD0000', offset: '0x1F' },
];

const DIST_PRESETS = [
  { label: '0x1000 → 0x2000', a: '0x1000', b: '0x2000' },
  { label: '0xBFFF0000 → 0xC0000000', a: '0xBFFF0000', b: '0xC0000000' },
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

const Field = ({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) => (
  <div className="flex flex-col gap-1 flex-1 min-w-0">
    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
      {label} {hint && <span className="font-normal text-gray-400 normal-case">{hint}</span>}
    </label>
    <input
      className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

/** The 32-bit value split into four labelled bytes so the bit layout is readable. */
const ByteStrip = ({ binary }: { binary: string }) => (
  <div className="flex flex-wrap gap-2">
    {[0, 1, 2, 3].map(i => {
      const bits = binary.slice(i * 8, i * 8 + 8);
      const high = 31 - i * 8;
      return (
        <div key={i} className="border border-gray-200 px-2 py-1">
          <div className="font-mono text-[10px] text-gray-400 mb-0.5">
            {high}–{high - 7}
          </div>
          <div className="font-mono text-sm text-gray-900 tracking-widest">
            {bits.slice(0, 4)} {bits.slice(4)}
          </div>
        </div>
      );
    })}
  </div>
);

const PageRow = ({ page }: { page: PageInfo }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 border-t border-gray-200 px-3 py-2 font-mono text-xs text-gray-900">
    <span className="font-bold">{page.pageSize}</span>
    <span>#{page.pageNumber}</span>
    <span className="text-gray-600">{page.pageStart}</span>
    <span className="text-gray-600">
      +{page.offset}
      <span className="text-gray-400"> ({page.offsetDecimal})</span>
    </span>
  </div>
);

const AlignmentChip = ({ info }: { info: AlignmentInfo }) => (
  <div
    className={`border px-3 py-2 ${
      info.aligned ? 'bg-emerald-50 border-emerald-200' : 'border-gray-200'
    }`}
  >
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-sm font-bold text-gray-900">{info.alignment}</span>
      <span
        className={`text-[10px] font-bold uppercase tracking-widest ${
          info.aligned ? 'text-emerald-700' : 'text-gray-400'
        }`}
      >
        {info.aligned ? 'aligned' : 'off'}
      </span>
    </div>
    <div className="font-mono text-[11px] text-gray-500 mt-1">
      {info.aligned ? info.alignedDown : `+${info.toNextBoundary} → ${info.alignedUp}`}
    </div>
  </div>
);

const SectionTitle = ({ children, note }: { children: React.ReactNode; note?: string }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-3">
    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{children}</span>
    {note && <span className="text-[11px] text-gray-400">{note}</span>}
  </div>
);

export function MemoryAddrCalculator() {
  const [mode, setMode] = useState<Mode>('calculate');
  const [base, setBase] = useState('0x1000');
  const [offset, setOffset] = useState('0x100');
  const [addr1, setAddr1] = useState('0x1000');
  const [addr2, setAddr2] = useState('0x2000');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) {
      setBase(from);
      setAddr1(from);
    }
    const to = p.get('offset');
    if (to) setOffset(to);
  }, []);

  const calc = useMemo(
    () => (base.trim() ? calculateAddress(base, offset) : null),
    [base, offset]
  );

  const dist = useMemo(
    () => (addr1.trim() && addr2.trim() ? calculateDistance(addr1, addr2) : null),
    [addr1, addr2]
  );

  const equation = `${base.trim() || '?'} + ${offset.trim() || '0'}`;

  return (
    <Panel
      title="Memory Address Calculator"
      description="Add an offset to a base address, check its alignment (2/4/8/16/64-byte), see which [1 4KB/64KB/2MB/1GB 2] page it lands in, or measure the distance between two addresses. Accepts hex like [1 0x7FFF0000 2] or decimal."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Mode switch */}
          <div className="flex gap-1">
            {MODES.map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-3 py-2 text-xs font-bold transition-colors duration-150 cursor-pointer border ${
                  mode === m.id
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {mode === 'calculate' ? (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Field
                    label="Base address"
                    value={base}
                    onChange={setBase}
                    placeholder="0x7FFF0000 or 2147418112"
                  />
                  <Field
                    label="Offset"
                    hint="hex or decimal"
                    value={offset}
                    onChange={setOffset}
                    placeholder="0x100 or 256"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Try
                  </span>
                  {CALC_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setBase(p.base);
                        setOffset(p.offset);
                      }}
                      className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {calc?.error && <p className="text-rose-700 text-sm font-mono">{calc.error}</p>}

              {calc && !calc.error && (
                <>
                  {/* Result address */}
                  <div className="border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Result address
                      </span>
                      <CopyButton text={calc.address} />
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900 break-all">
                      {calc.address}
                    </div>
                    <div className="font-mono text-xs text-gray-500 mt-2 break-all">{equation}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <ValueCard label="Decimal" value={calc.addressDecimal} />
                    <ValueCard label="Binary" value={calc.addressBinary} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <SectionTitle note="32-bit layout, most significant byte first">
                      Bit layout
                    </SectionTitle>
                    <ByteStrip binary={calc.addressBinary} />
                  </div>

                  {/* Pages */}
                  <div className="flex flex-col gap-3">
                    <SectionTitle>Page mapping</SectionTitle>
                    <div className="border border-gray-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 bg-gray-50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <span>Page size</span>
                        <span>Page number</span>
                        <span>Page start</span>
                        <span>Offset in page</span>
                      </div>
                      {calc.pageInfo.map(p => (
                        <PageRow key={p.pageSize} page={p} />
                      ))}
                    </div>
                  </div>

                  {/* Alignment */}
                  <div className="flex flex-col gap-3">
                    <SectionTitle note="unaligned entries show the padding to the next boundary">
                      Alignment
                    </SectionTitle>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {calc.alignmentInfo.map(a => (
                        <AlignmentChip key={a.alignment} info={a} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Field
                    label="Address 1"
                    value={addr1}
                    onChange={setAddr1}
                    placeholder="0x1000"
                  />
                  <Field
                    label="Address 2"
                    value={addr2}
                    onChange={setAddr2}
                    placeholder="0xBFFF0000"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Try
                  </span>
                  {DIST_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setAddr1(p.a);
                        setAddr2(p.b);
                      }}
                      className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {dist?.error && <p className="text-rose-700 text-sm font-mono">{dist.error}</p>}

              {dist && !dist.error && (
                <>
                  <div className="border border-emerald-200 bg-emerald-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        addr2 − addr1
                      </span>
                      <CopyButton text={dist.signedDistance} />
                    </div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900 break-all">
                      {dist.signedDistance}
                      <span className="text-base font-bold text-gray-500"> bytes</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 font-mono break-all">
                      {dist.direction === 'same'
                        ? 'Both addresses are identical'
                        : `${addr2.trim()} is ${dist.human} ${dist.direction} ${addr1.trim()}`}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <ValueCard label="Absolute (dec)" value={dist.distanceDecimal} />
                    <ValueCard label="Absolute (hex)" value={dist.distance} />
                    <ValueCard label="Size" value={dist.human} />
                  </div>

                  <div className="flex flex-col gap-3">
                    <SectionTitle note="how far apart the two addresses are in whole pages">
                      Span
                    </SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[4096, 65536, 2097152].map(size => {
                        const bytes = Number(dist.distanceDecimal);
                        return (
                          <div key={size} className="border border-gray-200 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                              {humanBytes(size)} pages
                            </div>
                            <div className="font-mono text-sm font-bold text-gray-900">
                              {Math.floor(bytes / size)}
                              <span className="font-normal text-gray-400">
                                {' '}
                                + {bytes % size} B
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
