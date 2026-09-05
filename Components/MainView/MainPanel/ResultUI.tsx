'use client';

import React, { useState } from 'react';
import { FileDropZone, LoadFileButton } from '@/Components/View/FileInput';
import { trimTrailingNewline } from '@/lib/textFile';

/**
 * Shared building blocks for tools whose output is a *report* rather than text
 * to copy out. Tools that used to stringify a result object into a textarea
 * render these instead. See BitfieldTools / MemoryAddrTools for the pattern.
 */

export const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm';

export const CopyButton = ({ text, label }: { text: string; label?: string }) => {
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
      aria-label={`Copy ${label ?? text}`}
      className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
    >
      {copied ? 'copied' : 'copy'}
    </button>
  );
};

/** A labelled value with a copy affordance — for things the user wants to take away. */
export const ValueCard = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-gray-200 bg-gray-50 px-3 py-2 min-w-0">
    <div className="flex items-center justify-between gap-3 mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      <CopyButton text={value} label={label} />
    </div>
    <div className="font-mono text-sm text-gray-900 break-all">{value}</div>
  </div>
);

/** A single computed figure. The workhorse of every statistics-style tool. */
export const StatTile = ({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <div className="border border-gray-200 px-3 py-2 min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{label}</div>
    <div className="font-mono text-sm font-bold text-gray-900 break-all">{value}</div>
    {hint && <div className="text-[11px] text-gray-400 mt-0.5">{hint}</div>}
  </div>
);

/** The headline answer, when a tool has exactly one. */
export const HeroResult = ({
  label,
  value,
  note,
  tone = 'neutral',
  copyText,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  tone?: BadgeTone;
  copyText?: string;
}) => (
  <div className={`border px-4 py-4 ${toneSurface[tone]}`}>
    <div className="flex items-center justify-between gap-3 mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
      {copyText && <CopyButton text={copyText} label={label} />}
    </div>
    <div className="font-mono text-2xl sm:text-3xl font-black text-gray-900 break-all">{value}</div>
    {note && <div className="font-mono text-xs text-gray-500 mt-2 break-all">{note}</div>}
  </div>
);

export type BadgeTone = 'neutral' | 'pass' | 'warn' | 'fail' | 'info';

const toneSurface: Record<BadgeTone, string> = {
  neutral: 'bg-gray-50 border-gray-200',
  pass: 'bg-emerald-50 border-emerald-200',
  warn: 'bg-amber-50 border-amber-200',
  fail: 'bg-rose-50 border-rose-200',
  info: 'bg-indigo-50 border-indigo-200',
};

const toneText: Record<BadgeTone, string> = {
  neutral: 'text-gray-600',
  pass: 'text-emerald-700',
  warn: 'text-amber-700',
  fail: 'text-rose-700',
  info: 'text-indigo-700',
};

/** Replaces the ✓ / ✗ / ⚠ glyphs the text-dump tools embedded in their strings. */
export const StatusBadge = ({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) => (
  <span
    className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${toneSurface[tone]} ${toneText[tone]}`}
  >
    {children}
  </span>
);

export const SectionTitle = ({
  children,
  note,
}: {
  children: React.ReactNode;
  note?: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-baseline justify-between gap-3">
    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">{children}</span>
    {note && <span className="text-[11px] text-gray-400">{note}</span>}
  </div>
);

/** Wrap wide tables so the page body never scrolls sideways. */
export const ResultTable = ({
  headers,
  rows,
  align = [],
}: {
  headers: React.ReactNode[];
  rows: React.ReactNode[][];
  /** Per-column text alignment; defaults to left. */
  align?: ('left' | 'right')[];
}) => (
  <div className="border border-gray-200 overflow-x-auto">
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-gray-50">
          {headers.map((h, i) => (
            <th
              key={i}
              className={`px-3 py-2 font-bold uppercase tracking-widest text-[10px] text-gray-500 whitespace-nowrap ${
                align[i] === 'right' ? 'text-right' : 'text-left'
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r} className="border-t border-gray-200">
            {row.map((cell, c) => (
              <td
                key={c}
                className={`px-3 py-2 font-mono text-gray-900 ${
                  align[c] === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Field = ({
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = 'text',
  file = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  /**
   * The field holds text a user might keep in a file (one side of a
   * comparison, a token, a certificate) rather than a number or a date: it
   * then takes a dropped file too. The trailing newline a text editor leaves
   * behind is dropped, since this is a one-line value.
   */
  file?: boolean;
}) => {
  const loadFromFile = (text: string) => onChange(trimTrailingNewline(text));
  const box = (
    <input
      type={type}
      className={inputClass}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 h-6">
        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {label} {hint && <span className="font-normal text-gray-400 normal-case">{hint}</span>}
        </label>
        {file && <LoadFileButton onText={loadFromFile} title={`Load ${label} from a file`} />}
      </div>
      {file ? <FileDropZone onText={loadFromFile}>{box}</FileDropZone> : box}
    </div>
  );
};

/** The "Try …" row of example inputs every tool offers. */
export const PresetRow = <T,>({
  presets,
  onPick,
  label = 'Try',
}: {
  presets: { label: string; value: T }[];
  onPick: (value: T) => void;
  label?: string;
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    {presets.map(p => (
      <button
        key={p.label}
        onClick={() => onPick(p.value)}
        className="font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
      >
        {p.label}
      </button>
    ))}
  </div>
);

export const ErrorNote = ({ children }: { children: React.ReactNode }) => (
  <p className="text-rose-700 text-sm font-mono">{children}</p>
);

/**
 * Vertical bar chart for distributions and frequency counts.
 * Pure CSS — no charting dependency.
 */
export const BarChart = ({
  bars,
  height = 120,
  tone = 'info',
}: {
  bars: { label: string; value: number; title?: string }[];
  height?: number;
  tone?: BadgeTone;
}) => {
  const max = Math.max(1, ...bars.map(b => b.value));
  const fill: Record<BadgeTone, string> = {
    neutral: 'bg-gray-400',
    pass: 'bg-emerald-400',
    warn: 'bg-amber-400',
    fail: 'bg-rose-400',
    info: 'bg-indigo-400',
  };

  return (
    <div className="border border-gray-200 overflow-x-auto">
      <div className="flex items-end gap-px px-3 pt-3 min-w-fit" style={{ height }}>
        {bars.map((b, i) => (
          <div
            key={i}
            title={b.title ?? `${b.label}: ${b.value}`}
            className="flex-1 min-w-[8px] flex flex-col justify-end items-center h-full"
          >
            {b.value > 0 && (
              <span className="text-[9px] font-mono text-gray-400 leading-none mb-0.5">
                {b.value}
              </span>
            )}
            <div
              className={`w-full ${b.value > 0 ? fill[tone] : 'bg-gray-100'}`}
              style={{ height: `${(b.value / max) * 100}%`, minHeight: b.value > 0 ? 2 : 1 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-px px-3 pb-2 pt-1 min-w-fit border-t border-gray-100 mt-1">
        {bars.map((b, i) => (
          <div
            key={i}
            className="flex-1 min-w-[8px] text-center font-mono text-[9px] text-gray-400 truncate"
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Five-number summary drawn to scale: whiskers to min/max, box across the IQR. */
export const BoxPlot = ({
  min,
  q1,
  median,
  q3,
  max,
  format = (n: number) => String(n),
}: {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  format?: (n: number) => string;
}) => {
  const span = max - min;
  // A zero-width span would divide by zero; render everything centred instead.
  const pct = (v: number) => (span === 0 ? 50 : ((v - min) / span) * 100);

  return (
    <div className="border border-gray-200 px-4 pt-6 pb-3">
      <div className="relative h-10">
        {/* Whisker line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300" />
        {/* Whisker caps */}
        {[0, 100].map(p => (
          <div
            key={p}
            className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-gray-400"
            style={{ left: `${p}%` }}
          />
        ))}
        {/* Interquartile box */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-8 bg-indigo-100 border border-indigo-300"
          style={{ left: `${pct(q1)}%`, width: `${Math.max(0.5, pct(q3) - pct(q1))}%` }}
        />
        {/* Median */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-600"
          style={{ left: `${pct(median)}%` }}
        />
      </div>
      <div className="relative h-4 mt-1 font-mono text-[10px] text-gray-500">
        <span className="absolute left-0">{format(min)}</span>
        <span
          className="absolute -translate-x-1/2 text-indigo-700 font-bold"
          style={{ left: `${pct(median)}%` }}
        >
          {format(median)}
        </span>
        <span className="absolute right-0">{format(max)}</span>
      </div>
    </div>
  );
};

/** Horizontal proportion bar — for frequency lists, ratios, distributions. */
export const Meter = ({ ratio, tone = 'info' }: { ratio: number; tone?: BadgeTone }) => {
  const fill: Record<BadgeTone, string> = {
    neutral: 'bg-gray-400',
    pass: 'bg-emerald-400',
    warn: 'bg-amber-400',
    fail: 'bg-rose-400',
    info: 'bg-indigo-400',
  };
  return (
    <div className="h-2 w-full bg-gray-100 border border-gray-200">
      <div
        className={`h-full ${fill[tone]}`}
        style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
      />
    </div>
  );
};
