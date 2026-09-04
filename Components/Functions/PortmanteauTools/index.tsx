'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  Field,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzePortmanteau,
  cutPoints,
  makeBlend,
  FAMOUS_BLENDS,
  type Blend,
  type BlendKind,
  type TailMode,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'smoke / fog', value: ['smoke', 'fog'] },
  { label: 'breakfast / lunch', value: ['breakfast', 'lunch'] },
  { label: 'motor / hotel', value: ['motor', 'hotel'] },
  { label: 'camera / recorder', value: ['camera', 'recorder'] },
  { label: 'friend / enemy', value: ['friend', 'enemy'] },
];

const KIND_LABEL: Record<BlendKind, string> = {
  overlap: 'overlap',
  splice: 'splice',
  head: 'whole 2nd word',
  tail: 'whole 1st word',
  clip: 'front clip',
};

const KIND_TONE: Record<BlendKind, BadgeTone> = {
  overlap: 'warn',
  splice: 'pass',
  head: 'neutral',
  tail: 'neutral',
  clip: 'info',
};

/** Word 1 keeps rose, word 2 keeps indigo, shared letters amber. */
const HEAD_TINT = 'bg-rose-100 border-rose-300 text-rose-900';
const TAIL_TINT = 'bg-indigo-100 border-indigo-300 text-indigo-900';
const SHARED_TINT = 'bg-amber-100 border-amber-300 text-amber-900';
const DROPPED_TINT = 'bg-white border-dashed border-gray-200 text-gray-400 line-through';

function scoreTone(score: number): BadgeTone {
  if (score >= 0.8) return 'pass';
  if (score >= 0.6) return 'warn';
  return 'fail';
}

/**
 * The blended word with each letter coloured by where it came from. Overlap
 * letters are the ones doing double duty, so they get their own colour rather
 * than being arbitrarily assigned to one side.
 */
function BlendWord({ blend, size = 'lg' }: { blend: Blend; size?: 'lg' | 'sm' }) {
  const cells = size === 'lg' ? 'w-9 h-11 text-xl' : 'w-6 h-7 text-sm';
  const sharedFrom = blend.head.length - blend.shared.length;

  return (
    <span className="inline-flex flex-wrap gap-px">
      {blend.result.split('').map((ch, i) => {
        const fromHead = i < blend.head.length;
        const isShared = blend.shared.length > 0 && fromHead && i >= sharedFrom;
        return (
          <span
            key={i}
            className={`${cells} flex items-center justify-center border font-mono font-bold uppercase ${
              isShared ? SHARED_TINT : fromHead ? HEAD_TINT : TAIL_TINT
            }`}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

/**
 * One source word as clickable letters. Clicking sets the cut, so the whole
 * blend is manipulable rather than being a fixed list of suggestions.
 */
function LetterRow({
  word,
  cut,
  keepSide,
  tint,
  onCut,
}: {
  word: string;
  cut: number;
  /** Which side of the cut survives into the blend. */
  keepSide: 'start' | 'end';
  tint: string;
  onCut: (cut: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-px">
      {word.split('').map((ch, i) => {
        const kept = keepSide === 'start' ? i < cut : i >= cut;
        // Clicking always means "make this letter the edge of the kept part".
        const target = keepSide === 'start' ? i + 1 : i;
        return (
          <button
            key={i}
            onClick={() => onCut(target)}
            title={
              keepSide === 'start'
                ? `Keep “${word.slice(0, i + 1)}”`
                : `Keep “${word.slice(i)}”`
            }
            className={`w-8 h-10 flex items-center justify-center border font-mono font-bold uppercase text-lg transition-colors duration-150 cursor-pointer hover:border-gray-900 ${
              kept ? tint : DROPPED_TINT
            }`}
          >
            {ch}
          </button>
        );
      })}
    </div>
  );
}

/** The syllable-boundary cuts, as buttons — this is where good blends come from. */
function CutSuggestions({
  word,
  cut,
  keepSide,
  onCut,
}: {
  word: string;
  cut: number;
  keepSide: 'start' | 'end';
  onCut: (cut: number) => void;
}) {
  const points = cutPoints(word).filter(p =>
    keepSide === 'start' ? p.index > 0 : p.index < word.length
  );
  if (points.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Cuts</span>
      {points.map(p => {
        const active = p.index === cut;
        const kept = keepSide === 'start' ? word.slice(0, p.index) : word.slice(p.index);
        const dropped = keepSide === 'start' ? word.slice(p.index) : word.slice(0, p.index);
        return (
          <button
            key={p.index}
            onClick={() => onCut(p.index)}
            title={`${p.kind === 'onset' ? 'Onset boundary' : p.kind === 'syllable' ? 'Syllable boundary' : 'Word edge'} — keep “${kept}”`}
            className={`font-mono text-xs px-2 py-1 border transition-colors duration-150 cursor-pointer ${
              active
                ? 'border-gray-900 text-gray-900 bg-gray-50'
                : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
            }`}
          >
            {keepSide === 'start' ? (
              <>
                <span className="text-gray-900 font-bold">{kept}</span>
                <span className="opacity-40">|{dropped}</span>
              </>
            ) : (
              <>
                <span className="opacity-40">{dropped}|</span>
                <span className="text-gray-900 font-bold">{kept}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PortmanteauGenerator() {
  const [a, setA] = useState('smoke');
  const [b, setB] = useState('fog');
  /**
   * The manually chosen cut, tagged with the word pair it belongs to. Tagging
   * rather than clearing on change is what lets a reversed suggestion swap the
   * two fields and set its cuts in the same click.
   */
  const [cut, setCut] = useState<{ h: number; t: number; m: TailMode; for: string } | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from');
    if (!from) return;
    // `?from=` carried both words space-separated, as the old textarea did.
    const [first, second] = from.trim().split(/\s+/);
    if (first) setA(first);
    if (second) setB(second);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: [a, b].filter(Boolean).join(' ') })

  const result = useMemo(() => analyzePortmanteau(a, b), [a, b]);
  const { word1, word2 } = result;
  const pairKey = `${word1}|${word2}`;

  // Until the user touches a letter, the splice tracks the best suggestion in
  // the entered order, so the page is never showing an arbitrary default.
  const bestForward = useMemo(() => result.blends.find(x => !x.reversed) ?? null, [result]);
  const active =
    cut && cut.for === pairKey
      ? cut
      : bestForward
        ? { h: bestForward.headCut, t: bestForward.tailCut, m: bestForward.tailMode, for: pairKey }
        : { h: Math.ceil(word1.length / 2), t: Math.floor(word2.length / 2), m: 'end' as TailMode, for: pairKey };

  const current = useMemo(
    () => (result.error ? null : makeBlend(word1, word2, active.h, active.t, false, active.m)),
    [result.error, word1, word2, active.h, active.t, active.m]
  );

  const setActive = (patch: Partial<{ h: number; t: number; m: TailMode }>) =>
    setCut({ ...active, ...patch, for: pairKey });

  const swap = () => {
    setA(b);
    setB(a);
    setCut(null);
  };

  const load = (blend: Blend) => {
    if (blend.reversed) {
      setA(blend.first);
      setB(blend.second);
    }
    setCut({
      h: blend.headCut,
      t: blend.tailCut,
      m: blend.tailMode,
      for: `${blend.first}|${blend.second}`,
    });
  };

  const pick = ([first, second]: string[]) => {
    setA(first);
    setB(second);
    setCut(null);
  };

  const visible = showAll ? result.blends : result.blends.slice(0, 12);

  // Which of the well-known blends this generator actually reaches. Recomputed
  // only on mount — the table is fixed reference data, not tied to the input.
  const famous = useMemo(
    () =>
      FAMOUS_BLENDS.map(f => {
        const rank = analyzePortmanteau(f.word1, f.word2).blends.findIndex(
          x => x.result === f.blend
        );
        return { ...f, rank };
      }),
    []
  );
  const famousFound = famous.filter(f => f.rank >= 0).length;

  return (
    <Panel
      title="Portmanteau Generator"
      description="Blend two words into one, the way [1 smoke + fog 2] makes smog and [1 motor + hotel 2] makes motel. Cuts are taken at syllable boundaries so the results stay pronounceable — click any letter below to move a cut yourself and watch the blend change."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-8">
          {/* Inputs */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <Field label="First word" value={a} onChange={setA} placeholder="smoke" />
              <button
                onClick={swap}
                aria-label="Swap the two words"
                title="Swap"
                className="px-3 py-3 text-sm border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer flex-shrink-0"
              >
                ⇄
              </button>
              <Field label="Second word" value={b} onChange={setB} placeholder="fog" />
            </div>
            <PresetRow presets={PRESETS} onPick={pick} />
          </div>

          {result.error && (
            <div className="border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
              {result.error}
            </div>
          )}

          {current && (
            <>
              {/* The blend, and the two words it is cut from */}
              <div className="flex flex-col gap-4">
                <SectionTitle note="click a letter to move a cut">The blend</SectionTitle>

                <div className="border border-gray-200 px-4 py-5 flex flex-col gap-5">
                  {/* Word 1 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700">
                        {word1} — keeping “{current.head || '—'}”
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {result.syllables1.length} syllable
                        {result.syllables1.length === 1 ? '' : 's'} ·{' '}
                        {result.syllables1.map(s => s.text).join('·')}
                      </span>
                    </div>
                    <LetterRow
                      word={word1}
                      cut={active.h}
                      keepSide="start"
                      tint={HEAD_TINT}
                      onCut={h => setActive({ h })}
                    />
                    <CutSuggestions
                      word={word1}
                      cut={active.h}
                      keepSide="start"
                      onCut={h => setActive({ h })}
                    />
                  </div>

                  {/* Word 2 */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                        {word2} — keeping “{current.tail || '—'}”
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400">
                          {result.syllables2.map(s => s.text).join('·')}
                        </span>
                        <button
                          onClick={() =>
                            setActive({
                              m: active.m === 'end' ? 'start' : 'end',
                              // The cut index means the opposite side now, so
                              // mirror it and keep roughly the same letters.
                              t: word2.length - active.t,
                            })
                          }
                          title="Switch which end of the second word survives"
                          className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                        >
                          ⇄ keep the {active.m === 'end' ? 'start' : 'end'} instead
                        </button>
                      </div>
                    </div>
                    <LetterRow
                      word={word2}
                      cut={active.t}
                      keepSide={active.m}
                      tint={TAIL_TINT}
                      onCut={t => setActive({ t })}
                    />
                    <CutSuggestions
                      word={word2}
                      cut={active.t}
                      keepSide={active.m}
                      onCut={t => setActive({ t })}
                    />
                  </div>

                  {/* Result */}
                  <div className="border-t border-gray-200 pt-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        Result
                      </span>
                      {current.result ? (
                        <BlendWord blend={current} />
                      ) : (
                        <span className="font-mono text-gray-400 text-xl">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge tone={KIND_TONE[current.kind]}>
                        {KIND_LABEL[current.kind]}
                      </StatusBadge>
                      {current.result && <CopyButton text={current.result} label="blend" />}
                    </div>
                  </div>

                  {current.issues.length > 0 ? (
                    <div className="border border-amber-200 bg-amber-50 px-3 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                        Not suggested
                      </span>
                      <ul className="mt-1 text-xs text-amber-900 list-disc list-inside">
                        {current.issues.map(issue => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {current.notes.join(' + ')}
                      {current.shared && ` — “${current.shared}” belongs to both words`}
                    </p>
                  )}
                </div>
              </div>

              {/* Why this blend scores what it does */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="what the ranking is built from">Blend quality</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      label: 'Seam',
                      value: current.seamScore,
                      hint: 'do the consonants either side of the join read as English',
                    },
                    {
                      label: 'Compression',
                      value: current.compressionScore,
                      hint: 'a blend drops roughly half its letters',
                    },
                    {
                      label: 'Share',
                      value: current.shareScore,
                      hint: 'how much of the thinner-sliced word survives',
                    },
                  ].map(s => (
                    <div key={s.label} className="border border-gray-200 px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          {s.label}
                        </span>
                        <span className="font-mono text-xs text-gray-500">
                          {Math.round(s.value * 100)}%
                        </span>
                      </div>
                      <Meter ratio={s.value} tone={scoreTone(s.value)} />
                      <div className="text-[11px] text-gray-400 mt-1.5">{s.hint}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile
                  label="Suggestions"
                  value={result.blends.length}
                  hint={`from ${result.cuts1.length}×${result.cuts2.length} cut positions`}
                />
                <StatTile
                  label="Best"
                  value={result.best ? result.best.result : '—'}
                  hint={result.best ? `${Math.round(result.best.score * 100)}% quality` : undefined}
                />
                <StatTile
                  label="Syllables"
                  value={`${result.syllables1.length} + ${result.syllables2.length}`}
                  hint={`${word1.length} + ${word2.length} letters`}
                />
                <StatTile
                  label="This blend"
                  value={`${Math.round(current.score * 100)}%`}
                  hint={
                    result.blends.findIndex(x => x.result === current.result) >= 0
                      ? `ranked #${result.blends.findIndex(x => x.result === current.result) + 1}`
                      : 'not in the suggestions'
                  }
                />
              </div>

              {/* Ranked suggestions */}
              {result.blends.length > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle
                    note={
                      result.blends.length > 12 && !showAll
                        ? `showing 12 of ${result.blends.length}`
                        : `${result.blends.length} total, best first`
                    }
                  >
                    Suggestions
                  </SectionTitle>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {visible.map(blend => {
                      const isCurrent = blend.result === current.result;
                      return (
                        <button
                          key={`${blend.result}-${blend.reversed}`}
                          onClick={() => load(blend)}
                          title={blend.notes.join(' + ')}
                          className={`border px-3 py-3 text-left flex flex-col gap-2 transition-colors duration-150 cursor-pointer ${
                            isCurrent
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <BlendWord blend={blend} size="sm" />
                            <span className="font-mono text-[11px] text-gray-400 flex-shrink-0">
                              {Math.round(blend.score * 100)}%
                            </span>
                          </div>
                          <Meter ratio={blend.score} tone={scoreTone(blend.score)} />
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge tone={KIND_TONE[blend.kind]}>
                              {KIND_LABEL[blend.kind]}
                            </StatusBadge>
                            {blend.reversed && (
                              <StatusBadge tone="neutral">
                                {blend.first} first
                              </StatusBadge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {result.blends.length > 12 && (
                    <button
                      onClick={() => setShowAll(v => !v)}
                      className="self-start font-mono text-xs px-2 py-1 border border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer"
                    >
                      {showAll ? 'show fewer' : `show all ${result.blends.length}`}
                    </button>
                  )}
                </div>
              )}

              {result.blends.length === 0 && (
                <div className="border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                  No blend of these two words survives the pronounceability checks. Words that
                  share few sounds, or that are very close to each other, tend to leave nothing
                  usable — try a longer or more dissimilar pair.
                </div>
              )}
            </>
          )}

          {/* Reference */}
          <div className="flex flex-col gap-3">
            <SectionTitle note={`this tool reaches ${famousFound} of ${famous.length}`}>
              Well-known blends
            </SectionTitle>
            <ResultTable
              headers={['Blend', 'From', 'In suggestions']}
              align={['left', 'left', 'right']}
              rows={famous.map(f => [
                <button
                  key="b"
                  onClick={() => pick([f.word1, f.word2])}
                  className="font-bold text-gray-900 hover:underline cursor-pointer"
                >
                  {f.blend}
                </button>,
                <span key="f" className="text-gray-500">
                  {f.word1} + {f.word2}
                </span>,
                f.rank >= 0 ? (
                  <span key="r" className="text-emerald-700">
                    #{f.rank + 1}
                  </span>
                ) : (
                  <span key="r" className="text-gray-400">
                    —
                  </span>
                ),
              ])}
            />
            <p className="text-[11px] text-gray-400">
              Cuts are taken from spelling, not pronunciation, so the blends English actually
              settled on are not always the top-ranked ones — and a few are out of reach
              entirely. <span className="font-mono text-gray-500">pixel</span> respells{' '}
              <span className="font-mono text-gray-500">pics</span>, and{' '}
              <span className="font-mono text-gray-500">malware</span> needs the{' '}
              <span className="font-mono text-gray-500">soft·ware</span> compound boundary rather
              than the syllable one. Click any row to load it.
            </p>
          </div>
        </div>
      }
    />
  );
}
