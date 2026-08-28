'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeString,
  type CodePointCategory,
  type CodePointInfo,
} from './logic';

// Written as escapes on purpose: several of these are invisible in a source file,
// and the composed / decomposed pair is indistinguishable otherwise.
const PRESETS = [
  { label: 'caf\u00e9 (NFC)', value: 'caf\u00e9' },
  { label: 'caf\u00e9 (NFD)', value: 'cafe\u0301' },
  { label: 'family emoji', value: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}' },
  { label: 'hidden zero-width', value: 'ad\u200Bmin' },
  { label: 'bidi override', value: 'if (isAdmin\u202E) {' },
  { label: 'BOM + tab', value: '\uFEFFid\tname' },
];

const categoryTone: Record<CodePointCategory, BadgeTone> = {
  ascii: 'neutral',
  control: 'warn',
  whitespace: 'neutral',
  latin1: 'info',
  combining: 'info',
  invisible: 'warn',
  bidi: 'fail',
  bmp: 'info',
  astral: 'info',
};

const cellTone: Record<BadgeTone, string> = {
  neutral: 'border-gray-200 text-gray-900',
  pass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  warn: 'bg-amber-50 border-amber-200 text-amber-700',
  fail: 'bg-rose-50 border-rose-200 text-rose-700',
  info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
};

/** One tile per code point, so an invisible character still occupies visible space. */
const CodePointStrip = ({ points }: { points: CodePointInfo[] }) => (
  <div className="flex flex-wrap gap-1">
    {points.map(p => (
      <div
        key={p.index}
        title={`${p.hex} — ${p.name}`}
        className={`border px-2 py-1 text-center min-w-[2.75rem] ${cellTone[categoryTone[p.category]]}`}
      >
        <div className="font-mono text-base leading-tight break-all">{p.display}</div>
        <div className="font-mono text-[9px] opacity-70 leading-tight">
          {p.hex.replace('U+', '')}
        </div>
      </div>
    ))}
  </div>
);

export const StringInspector = () => {
  const [text, setText] = useState('café 👋');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setText(from);
  }, []);

  const report = useMemo(() => (text ? analyzeString(text) : null), [text]);

  const countsDisagree =
    report != null &&
    (report.graphemeCount !== report.codePointCount ||
      report.codePointCount !== report.utf16Units ||
      report.utf16Units !== report.utf8Bytes);

  return (
    <Panel
      title="String Inspector"
      description="Every way of counting a string at once — [1 UTF-8 2] bytes, [1 UTF-16 2] code units, [1 code points 2] and grapheme clusters — plus the code point behind each character and a flag on anything invisible, combining or deceptive."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
              htmlFor="string-input"
            >
              Text
            </label>
            <textarea
              id="string-input"
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none resize-y transition-colors duration-150 font-mono text-sm"
              rows={4}
              spellCheck={false}
              placeholder="Paste anything — the odder the better"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setText} />
          </div>

          {report && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile
                  label="UTF-8 bytes"
                  value={report.utf8Bytes}
                  hint="What goes over the wire"
                />
                <StatTile
                  label="UTF-16 units"
                  value={report.utf16Units}
                  hint="JS .length"
                />
                <StatTile
                  label="Code points"
                  value={report.codePointCount}
                  hint="[...str].length"
                />
                <StatTile
                  label="Graphemes"
                  value={report.graphemeCount}
                  hint="What a reader counts"
                />
              </div>

              {countsDisagree && (
                <p className="text-[11px] text-gray-500">
                  The four counts disagree, which is the usual source of truncated emoji and
                  off-by-one column limits: a database
                  <span className="font-mono"> VARCHAR(n)</span> counts one of them, your validator
                  probably counts another.
                </p>
              )}

              {report.flags.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle>Findings</SectionTitle>
                  <div className="flex flex-col gap-2">
                    {report.flags.map(f => (
                      <div
                        key={f.label}
                        className={`border px-3 py-2 ${
                          f.tone === 'fail'
                            ? 'bg-rose-50 border-rose-200'
                            : f.tone === 'warn'
                              ? 'bg-amber-50 border-amber-200'
                              : 'bg-indigo-50 border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge tone={f.tone}>{f.label}</StatusBadge>
                        </div>
                        <p className="text-xs text-gray-700">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionTitle
                  note={
                    report.truncated
                      ? `First ${report.codePoints.length} of ${report.codePointCount} code points`
                      : `${report.codePointCount} code point${report.codePointCount === 1 ? '' : 's'}`
                  }
                >
                  Characters
                </SectionTitle>
                <CodePointStrip points={report.codePoints} />
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle note="Bytes and units each character actually occupies">
                  Code point table
                </SectionTitle>
                <ResultTable
                  headers={['#', 'Char', 'Code point', 'Name', 'UTF-8', 'UTF-16', 'Escape']}
                  align={['right']}
                  rows={report.codePoints.map(p => [
                    p.index,
                    <span key="c" className={categoryTone[p.category] === 'fail' ? 'text-rose-700' : ''}>
                      {p.display}
                    </span>,
                    p.hex,
                    <span key="n" className="font-sans text-[11px] text-gray-500">{p.name}</span>,
                    p.utf8.join(' '),
                    p.utf16.join(' '),
                    p.escape,
                  ])}
                />
                {report.truncated && (
                  <p className="text-[11px] text-gray-400">
                    Table capped at {report.codePoints.length} code points.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle note="Same text under each Unicode normalisation form">
                  Normalisation
                </SectionTitle>
                <ResultTable
                  headers={['Form', 'Code points', 'UTF-8 bytes', 'Changes input', 'Result']}
                  align={['left', 'right', 'right', 'left', 'left']}
                  rows={report.normalization.map(n => [
                    <span key="f" className="font-bold">{n.form}</span>,
                    n.codePoints,
                    n.utf8Bytes,
                    n.changed ? (
                      <StatusBadge tone="warn">yes</StatusBadge>
                    ) : (
                      <StatusBadge tone="pass">no</StatusBadge>
                    ),
                    <span key="v" className="break-all">{n.value}</span>,
                  ])}
                />
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle
                  note={
                    <span className="inline-flex items-center gap-2">
                      {report.asciiOnly ? 'Pure ASCII' : 'Contains multi-byte sequences'}
                      <CopyButton text={report.utf8Hex} label="UTF-8 hex" />
                    </span>
                  }
                >
                  UTF-8 hex
                </SectionTitle>
                <pre className="border border-gray-200 bg-gray-50 px-3 py-3 overflow-x-auto font-mono text-xs text-gray-700 whitespace-pre-wrap break-all">
                  {report.utf8Hex}
                </pre>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
