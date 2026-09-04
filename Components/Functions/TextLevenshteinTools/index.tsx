'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  buildMatrix,
  countEditOps,
  editScript,
  hammingDistance,
  levenshtein,
  similarity,
  type EditOpType,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

/** Past this length the matrix grid stops being readable, so it is hidden. */
const MATRIX_LIMIT = 22;

/**
 * Longest pair the tool will compare.
 *
 * The traceback needs the full A x B matrix, so the work and the memory both
 * grow with the product. Two strings of a few thousand characters each are
 * enough to hang the tab, and `?a=` and `?b=` hand them over on page load with
 * no interaction.
 */
const COMPARE_LIMIT = 2000;

const OP_STYLE: Record<EditOpType, { cell: string; chip: string; label: string; glyph: string }> = {
  match:      { cell: 'bg-white text-gray-900',        chip: 'bg-gray-200 text-gray-600',      label: 'kept',        glyph: '=' },
  substitute: { cell: 'bg-amber-100 text-amber-900',   chip: 'bg-amber-400 text-white',        label: 'substituted', glyph: '~' },
  insert:     { cell: 'bg-emerald-100 text-emerald-900', chip: 'bg-emerald-500 text-white',    label: 'inserted',    glyph: '+' },
  delete:     { cell: 'bg-rose-100 text-rose-900',     chip: 'bg-rose-500 text-white',         label: 'deleted',     glyph: '−' },
};

/** Renders whitespace and control characters as something you can actually see. */
function visible(ch: string | null): string {
  if (ch === null) return '·';
  if (ch === ' ') return '␣';
  if (ch === '\n') return '⏎';
  if (ch === '\t') return '⇥';
  return ch;
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="bg-white p-4">
      <p className={`${labelClass} mb-1`}>{label}</p>
      <p className={`text-2xl font-black ${tone ?? 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </div>
  );
}

export function TextLevenshteinConverter() {
  const [a, setA] = useState('kitten');
  const [b, setB] = useState('sitting');

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from');
    if (from) {
      // Share links carried both strings on separate lines in the old text UI.
      const lines = from.split('\n');
      setA(lines[0] ?? '');
      setB(lines[1] ?? '');
    }
    if (params.get('a') !== null) setA(params.get('a') as string);
    if (params.get('b') !== null) setB(params.get('b') as string);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ a, b })

  const tooLong = a.length > COMPARE_LIMIT || b.length > COMPARE_LIMIT;

  const data = useMemo(() => {
    if (tooLong) return null;
    if (a === '' && b === '') return null;
    const distance = levenshtein(a, b);
    const script = editScript(a, b);
    const pathCells = new Set(script.path);
    return {
      distance,
      similarity: similarity(a, b),
      ops: countEditOps(a, b),
      hamming: hammingDistance(a, b),
      script,
      pathCells,
      matrix: a.length <= MATRIX_LIMIT && b.length <= MATRIX_LIMIT ? buildMatrix(a, b) : null,
    };
  }, [a, b, tooLong]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  return (
    <Panel
      title="Levenshtein Distance"
      description="Compare two strings and get the [1 edit distance 2] — the fewest single-character insertions, deletions, and substitutions that turn one into the other. Shows the actual edits it picked, and the [1 dynamic programming matrix 2] with the cheapest path traced through it."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>String A</label>
              <input className={inputClass} placeholder="kitten" value={a} onChange={e => setA(e.target.value)} />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>String B</label>
              <input className={inputClass} placeholder="sitting" value={b} onChange={e => setB(e.target.value)} />
            </div>
          </div>

          {tooLong && (
            <div className="border border-rose-300 bg-rose-50 px-4 py-3 text-rose-700 text-sm font-mono">
              Strings are limited to {COMPARE_LIMIT.toLocaleString()} characters. The matrix behind the
              distance grows with A × B, so a longer pair would lock the page up.
            </div>
          )}

          {!data && !tooLong && (
            <div className="border border-gray-200 px-4 py-3 text-gray-500 text-sm font-mono">
              Enter at least one string to compare.
            </div>
          )}

          {data && (
            <>
              {/* Headline */}
              <div className="bg-gray-900 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">Edit Distance</p>
                <p className="text-4xl font-black text-white leading-none">{data.distance}</p>
                <p className="text-sm text-gray-300 mt-2 font-mono">
                  {data.distance === 0
                    ? 'the strings are identical'
                    : `${data.distance} ${data.distance === 1 ? 'edit' : 'edits'} turn A into B`}
                </p>
              </div>

              {/* Similarity */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Similarity{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (1 − distance ÷ length of the longer string)
                  </span>
                </p>
                <div className="flex h-8 border border-gray-200">
                  <div
                    className="bg-gray-900 flex items-center overflow-hidden"
                    style={{ width: `${data.similarity * 100}%` }}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white px-2 whitespace-nowrap">
                      {(data.similarity * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-100" />
                </div>
              </div>

              {/* Op counts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
                <Stat label="Substitutions" value={String(data.ops.sub)} hint="changed in place" tone="text-amber-600" />
                <Stat label="Insertions" value={String(data.ops.ins)} hint="added to reach B" tone="text-emerald-600" />
                <Stat label="Deletions" value={String(data.ops.del)} hint="dropped from A" tone="text-rose-600" />
                <Stat
                  label="Hamming"
                  value={data.hamming === null ? '—' : String(data.hamming)}
                  hint={data.hamming === null ? 'needs equal lengths' : 'positions that differ'}
                />
              </div>

              {/* Alignment */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  The Edits{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (A on top, B below, read left to right)
                  </span>
                </p>
                <div className="border border-gray-200 p-3 overflow-x-auto">
                  <div className="flex gap-px min-w-fit">
                    {data.script.ops.map((op, i) => {
                      const style = OP_STYLE[op.type];
                      return (
                        <div key={i} className="flex flex-col items-stretch" title={style.label}>
                          <span className={`w-7 h-7 flex items-center justify-center font-mono text-sm border border-gray-200 ${op.a === null ? 'bg-gray-50 text-gray-400' : style.cell}`}>
                            {visible(op.a)}
                          </span>
                          <span className={`w-7 h-4 flex items-center justify-center font-mono text-[10px] font-bold ${style.chip}`}>
                            {style.glyph}
                          </span>
                          <span className={`w-7 h-7 flex items-center justify-center font-mono text-sm border border-gray-200 ${op.b === null ? 'bg-gray-50 text-gray-400' : style.cell}`}>
                            {visible(op.b)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                  {(['match', 'substitute', 'insert', 'delete'] as EditOpType[]).map(t => (
                    <span key={t} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                      <span className={`w-4 h-3 inline-flex items-center justify-center font-mono ${OP_STYLE[t].chip}`}>
                        {OP_STYLE[t].glyph}
                      </span>
                      {OP_STYLE[t].label}
                    </span>
                  ))}
                </div>
              </div>

              {/* DP matrix */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Dynamic Programming Matrix{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (each cell is the distance between the prefixes; the shaded run is the cheapest path)
                  </span>
                </p>
                {data.matrix === null ? (
                  <div className="border border-gray-200 px-4 py-3 text-gray-500 text-sm font-mono">
                    The matrix is drawn for strings up to {MATRIX_LIMIT} characters.
                  </div>
                ) : (
                  <div className="border border-gray-200 overflow-x-auto">
                    <table className="border-collapse font-mono text-xs">
                      <thead>
                        <tr>
                          <th className="w-7 h-7 bg-gray-50" />
                          <th className="w-7 h-7 bg-gray-50 text-gray-400 font-normal">ε</th>
                          {b.split('').map((ch, j) => (
                            <th key={j} className="w-7 h-7 bg-gray-50 text-gray-900 font-bold">
                              {visible(ch)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.matrix.map((row, i) => (
                          <tr key={i}>
                            <th className="w-7 h-7 bg-gray-50 text-gray-900 font-bold">
                              {i === 0 ? <span className="text-gray-400 font-normal">ε</span> : visible(a[i - 1])}
                            </th>
                            {row.map((cell, j) => {
                              const onPath = data.pathCells.has(`${i},${j}`);
                              const isCorner = i === data.matrix!.length - 1 && j === row.length - 1;
                              return (
                                <td
                                  key={j}
                                  className={`w-7 h-7 text-center border border-gray-100 ${
                                    isCorner
                                      ? 'bg-gray-900 text-white font-bold'
                                      : onPath
                                        ? 'bg-rose-200 text-rose-900 font-bold'
                                        : 'bg-white text-gray-400'
                                  }`}
                                >
                                  {cell}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  Bottom-right corner = the answer. {data.ops.match} of {data.script.ops.length} positions needed no
                  edit at all.
                </p>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
