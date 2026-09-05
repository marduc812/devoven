'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  LAYOUTS,
  LAYOUT_ROWS,
  analyzeLayout,
  bestLayout,
  letterFrequency,
  scoreLayout,
  type FingerName,
  type LayoutAnalysis,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'Pangram', value: 'The quick brown fox jumps over the lazy dog' },
  {
    label: 'Code-ish',
    value: 'const handleSubmit = async (event) => { await save(event.target.value); }',
  },
  {
    label: 'Prose',
    value: 'It was the best of times, it was the worst of times, it was the age of wisdom.',
  },
];

const FINGERS: FingerName[] = ['pinky', 'ring', 'middle', 'index'];

/** Usage heat, from untouched to hottest key in the text. */
function heatClass(count: number, max: number): string {
  if (count === 0) return 'bg-white border-gray-200 text-gray-400';
  const ratio = max === 0 ? 0 : count / max;
  if (ratio > 0.66) return 'bg-rose-200 border-rose-400 text-rose-900 font-bold';
  if (ratio > 0.33) return 'bg-amber-100 border-amber-300 text-amber-900';
  return 'bg-emerald-50 border-emerald-200 text-emerald-800';
}

const Keyboard = ({
  layoutName,
  freq,
  maxFreq,
}: {
  layoutName: string;
  freq: Record<string, number>;
  maxFreq: number;
}) => {
  const map = LAYOUTS[layoutName];

  const Key = ({ letter }: { letter: string }) => {
    if (!letter) return <span className="w-7 h-8" />;
    const count = freq[letter] || 0;
    const info = map[letter];
    return (
      <span
        title={`${letter.toUpperCase()} — ${count} use${count === 1 ? '' : 's'}${
          info ? ` · ${info.hand} ${info.finger}${info.isHomeRow ? ' · home row' : ''}` : ''
        }`}
        className={`w-7 h-8 flex flex-col items-center justify-center border font-mono text-xs ${heatClass(
          count,
          maxFreq
        )} ${info?.isHomeRow ? 'ring-1 ring-inset ring-gray-400' : ''}`}
      >
        <span className="leading-none uppercase">{letter}</span>
        {count > 0 && <span className="text-[8px] leading-none text-gray-500 mt-0.5">{count}</span>}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-1 items-center">
      {LAYOUT_ROWS[layoutName].map((row, r) => (
        <div key={r} className="flex gap-1" style={{ paddingLeft: r * 10 }}>
          <span className="flex gap-1">
            {row.left.map((k, i) => (
              <Key key={`l${i}`} letter={k} />
            ))}
          </span>
          <span className="w-3" />
          <span className="flex gap-1">
            {row.right.map((k, i) => (
              <Key key={`r${i}`} letter={k} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
};

/** Finger load, left pinky through right pinky, mirrored like real hands. */
const FingerLoad = ({ analysis }: { analysis: LayoutAnalysis }) => {
  const cells = [
    ...FINGERS.map(f => ({
      key: `left-${f}`,
      hand: 'Left',
      finger: f,
      count: analysis.fingerDistribution.left[f],
    })),
    ...[...FINGERS].reverse().map(f => ({
      key: `right-${f}`,
      hand: 'Right',
      finger: f,
      count: analysis.fingerDistribution.right[f],
    })),
  ];
  const max = Math.max(1, ...cells.map(c => c.count));

  return (
    <div className="flex gap-1">
      {cells.map((c, i) => (
        <div
          key={c.key}
          title={`${c.hand} ${c.finger}: ${c.count} keystroke${c.count === 1 ? '' : 's'}`}
          className={`flex-1 flex flex-col items-center gap-1 ${i === 3 ? 'mr-2' : ''}`}
        >
          <div className="w-full h-12 flex items-end bg-gray-100 border border-gray-200">
            <div className="w-full bg-indigo-400" style={{ height: `${(c.count / max) * 100}%` }} />
          </div>
          <span className="font-mono text-[9px] text-gray-400">{c.count}</span>
        </div>
      ))}
    </div>
  );
};

const LayoutCard = ({
  analysis,
  freq,
  maxFreq,
  isBest,
}: {
  analysis: LayoutAnalysis;
  freq: Record<string, number>;
  maxFreq: number;
  isBest: boolean;
}) => (
  <div className={`border flex flex-col ${isBest ? 'border-emerald-300' : 'border-gray-200'}`}>
    <div
      className={`flex items-center justify-between gap-3 border-b px-3 py-2 ${
        isBest ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <span className="font-bold text-sm text-gray-900">{analysis.layout}</span>
      {isBest && <StatusBadge tone="pass">best fit</StatusBadge>}
    </div>

    <div className="px-3 py-3 flex flex-col gap-3">
      <div className="overflow-x-auto">
        <Keyboard layoutName={analysis.layout} freq={freq} maxFreq={maxFreq} />
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Home row
          </div>
          <div className="text-gray-900 font-bold">{analysis.homeRowPercent}%</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SFBs</div>
          <div className="text-gray-900 font-bold">{analysis.sfbCount}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Alternation
          </div>
          <div className="text-gray-900 font-bold">{analysis.handAlternationRate}%</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Home row usage
        </span>
        <Meter ratio={analysis.homeRowPercent / 100} tone="pass" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Finger load <span className="font-normal text-gray-400 normal-case">left → right</span>
        </span>
        <FingerLoad analysis={analysis} />
      </div>
    </div>
  </div>
);

export function KeyboardLayoutAnalyzer() {
  const [input, setInput] = useState('The quick brown fox jumps over the lazy dog');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const { analyses, error } = useMemo(() => {
    if (!input.trim()) return { analyses: null, error: '' };
    if (!/[a-z]/i.test(input)) return { analyses: null, error: 'No alphabetic characters found.' };
    try {
      return {
        analyses: Object.keys(LAYOUTS).map(name => analyzeLayout(input, name)),
        error: '',
      };
    } catch (e) {
      return { analyses: null, error: e instanceof Error ? e.message : 'Error analyzing text' };
    }
  }, [input]);

  const freq = useMemo(() => letterFrequency(input), [input]);
  const maxFreq = useMemo(() => Math.max(0, ...Object.values(freq)), [freq]);
  const best = analyses ? bestLayout(analyses) : null;

  return (
    <Panel
      title="Keyboard Layout Analyzer"
      description="Compare [1 QWERTY 2], [1 Dvorak 2] and [1 Colemak 2] for a body of text. Each layout is drawn as a real key grid heat-mapped by usage, with home row percentage, same-finger bigrams, hand alternation and per-finger load."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Text to analyse{' '}
              <span className="font-normal text-gray-400 normal-case">
                letters only; case ignored
              </span>
            </label>
            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-28 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
                placeholder="The quick brown fox jumps over the lazy dog"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </FileTextArea>
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {analyses && best && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label="Letters analysed"
                  value={analyses[0].totalChars}
                  hint="non-letters are ignored"
                />
                <StatTile label="Distinct letters" value={Object.keys(freq).length} hint="of 26" />
                <StatTile
                  label="Most used key"
                  value={
                    maxFreq > 0
                      ? Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0].toUpperCase()
                      : '—'
                  }
                  hint={maxFreq > 0 ? `${maxFreq} times` : undefined}
                />
                <StatTile
                  label="Best fit"
                  value={<StatusBadge tone="pass">{best.layout}</StatusBadge>}
                  hint="home row + alternation − SFBs"
                />
              </div>

              {/* Layouts */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="darker keys are pressed more often; outlined keys are on the home row">
                  Layouts
                </SectionTitle>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-2">
                  {analyses.map(a => (
                    <LayoutCard
                      key={a.layout}
                      analysis={a}
                      freq={freq}
                      maxFreq={maxFreq}
                      isBest={a.layout === best.layout}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-white border border-gray-200" /> unused
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-emerald-50 border border-emerald-200" /> light
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-100 border border-amber-300" /> moderate
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-rose-200 border border-rose-400" /> heavy
                  </span>
                </div>
              </div>

              {/* Comparison */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="same-finger bigrams are consecutive keys on one finger — lower is better">
                  Comparison
                </SectionTitle>
                <ResultTable
                  headers={['Layout', 'Home row', 'Same-finger bigrams', 'Hand alternation', 'Score']}
                  align={['left', 'right', 'right', 'right', 'right']}
                  rows={analyses.map(a => [
                    <span key="n" className={a.layout === best.layout ? 'font-bold' : ''}>
                      {a.layout}
                      {a.layout === best.layout && <span className="text-emerald-600"> ★</span>}
                    </span>,
                    `${a.homeRowPercent}%`,
                    a.sfbCount,
                    `${a.handAlternationRate}%`,
                    scoreLayout(a),
                  ])}
                />
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
