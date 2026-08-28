'use client';
import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  Field,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzePermComb,
  formatBig,
  parsePermCombInput,
  type CountingCase,
  type PermCombReport,
} from './logic';

const PRESETS = [
  { label: '10 choose 3', value: { n: '10', r: '3' } },
  { label: 'poker hand · 52, 5', value: { n: '52', r: '5' } },
  { label: 'lottery · 49, 6', value: { n: '49', r: '6' } },
  { label: '4-digit PIN · 10, 4', value: { n: '10', r: '4' } },
  { label: 'big · 50, 25', value: { n: '50', r: '25' } },
];

/** One cell of the ordered × repetition matrix. */
const CaseCell = ({ item, highlight }: { item: CountingCase; highlight: boolean }) => (
  <div
    title={item.label}
    className={`border p-3 flex flex-col gap-1 min-w-0 ${
      highlight ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'
    }`}
  >
    <div className="flex items-baseline justify-between gap-2">
      <span className="font-mono text-xs font-bold text-gray-700">{item.formula}</span>
      <CopyButton text={item.display.raw} label={item.formula} />
    </div>
    <div className="font-mono text-xl font-black text-gray-900 break-all leading-tight">
      {item.display.exact ?? item.display.approx}
    </div>
    {item.display.exact === null && (
      <div className="font-mono text-[11px] text-gray-500">{item.display.digits} digits</div>
    )}
    <div className="text-[11px] text-gray-500 leading-snug">{item.example}</div>
  </div>
);

/** C(n,k) across every k, with the chosen r marked. Shows at a glance that the
 *  count peaks in the middle and that C(n,r) = C(n,n−r). */
const DistributionStrip = ({ report }: { report: PermCombReport }) => {
  if (!report.distribution) return null;
  const max = report.distribution.reduce((m, d) => (d.value > m ? d.value : m), BigInt(0));
  const maxNum = Number(max) || 1;

  return (
    <div className="border border-gray-200 overflow-x-auto">
      <div className="flex items-end gap-px px-3 pt-3 min-w-fit" style={{ height: 110 }}>
        {report.distribution.map(d => (
          <div
            key={d.k}
            title={`C(${report.n}, ${d.k}) = ${d.value.toString()}`}
            className="flex-1 min-w-[10px] flex flex-col justify-end h-full"
          >
            <div
              className={d.k === report.r ? 'bg-indigo-500' : 'bg-gray-300'}
              style={{ height: `${Math.max(1, (Number(d.value) / maxNum) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-px px-3 pb-2 pt-1 min-w-fit border-t border-gray-100 mt-1">
        {report.distribution.map(d => (
          <div
            key={d.k}
            className={`flex-1 min-w-[10px] text-center font-mono text-[9px] truncate ${
              d.k === report.r ? 'text-indigo-700 font-bold' : 'text-gray-400'
            }`}
          >
            {d.k}
          </div>
        ))}
      </div>
    </div>
  );
};

const TupleChips = ({ rows, brackets }: { rows: number[][]; brackets: [string, string] }) => (
  <div className="flex flex-wrap gap-1.5">
    {rows.map((row, i) => (
      <span key={i} className="font-mono text-[11px] border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-700">
        {brackets[0]}
        {row.join(', ')}
        {brackets[1]}
      </span>
    ))}
  </div>
);

export function PermutationCalculator() {
  const [nInput, setNInput] = useState('10');
  const [rInput, setRInput] = useState('3');
  const [listing, setListing] = useState<'combinations' | 'permutations'>('combinations');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) {
      // The old tool took both numbers in one field, so ?from=10 3 links keep working.
      const parts = from.trim().split(/[\s,]+/);
      if (parts[0]) setNInput(parts[0]);
      if (parts[1]) setRInput(parts[1]);
    }
    const n = p.get('n');
    const r = p.get('r');
    if (n) setNInput(n);
    if (r) setRInput(r);
  }, []);

  const { report, error } = useMemo(() => {
    try {
      const n = parsePermCombInput(nInput);
      const r = parsePermCombInput(rInput);
      return { report: analyzePermComb(n, r), error: '' };
    } catch (e) {
      return { report: null, error: (e as Error).message };
    }
  }, [nInput, rInput]);

  const byKey = (key: CountingCase['key']) => report?.cases.find(c => c.key === key);

  return (
    <Panel
      title="Permutation & Combination Calculator"
      description="Count the ways to pick [1 r 2] items from [1 n 2] — ordered or not, with repetition or not. Every figure is computed exactly with big integers, so the digits you see are the digits, and the classic [1 P(n,r) 2] and [1 C(n,r) 2] sit alongside the two repetition cases people usually mean instead."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Field label="n" hint="items to choose from" value={nInput} onChange={setNInput} placeholder="10" />
              <Field label="r" hint="items chosen" value={rInput} onChange={setRInput} placeholder="3" />
            </div>
            <PresetRow
              presets={PRESETS}
              onPick={v => {
                setNInput(v.n);
                setRInput(v.r);
              }}
            />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {report && (
            <>
              {report.notes.map(note => (
                <p key={note} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2">
                  {note}
                </p>
              ))}

              <div className="flex flex-col gap-2">
                <SectionTitle note={`picking ${report.r} from ${report.n}`}>
                  The four ways to count
                </SectionTitle>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 min-w-[520px]">
                    <div />
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-1">
                      No repetition
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 px-1">
                      With repetition
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 self-center pr-2 text-right">
                      Order
                      <br />
                      matters
                    </div>
                    {byKey('permutations') && <CaseCell item={byKey('permutations')!} highlight />}
                    {byKey('tuples') && <CaseCell item={byKey('tuples')!} highlight={false} />}

                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 self-center pr-2 text-right">
                      Order does
                      <br />
                      not matter
                    </div>
                    {byKey('combinations') && <CaseCell item={byKey('combinations')!} highlight />}
                    {byKey('multisets') && <CaseCell item={byKey('multisets')!} highlight={false} />}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  The two shaded cells are what &ldquo;permutations&rdquo; and &ldquo;combinations&rdquo; usually
                  mean.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <SectionTitle>How they relate</SectionTitle>
                <div className="border border-gray-200 bg-gray-50 px-3 py-3 font-mono text-xs text-gray-700 space-y-2">
                  <div>
                    P({report.n}, {report.r}) = C({report.n}, {report.r}) × {report.r}! ={' '}
                    <span className="text-gray-900">{byKey('combinations')!.display.approx}</span> ×{' '}
                    <span className="text-gray-900">{formatBig(report.rFactorial).approx}</span> ={' '}
                    <span className="text-gray-900 font-bold">{byKey('permutations')!.display.approx}</span>
                  </div>
                  <div className="text-gray-500">
                    Each unordered selection can be arranged {report.r}! ={' '}
                    {formatBig(report.rFactorial).exact ?? formatBig(report.rFactorial).approx} ways, which is
                    exactly the factor between the two.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <StatTile
                  label="n!"
                  value={report.factorials.n.exact ?? report.factorials.n.approx}
                  hint={`${report.factorials.n.digits} digits`}
                />
                <StatTile
                  label="r!"
                  value={report.factorials.r.exact ?? report.factorials.r.approx}
                  hint={`${report.factorials.r.digits} digits`}
                />
                <StatTile
                  label="(n−r)!"
                  value={
                    report.factorials.nMinusR
                      ? report.factorials.nMinusR.exact ?? report.factorials.nMinusR.approx
                      : '—'
                  }
                  hint={report.factorials.nMinusR ? `${report.factorials.nMinusR.digits} digits` : 'undefined for r > n'}
                />
              </div>

              {report.distribution && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note={`C(${report.n}, k) for every k — your r is highlighted`}>
                    Where r sits
                  </SectionTitle>
                  <DistributionStrip report={report} />
                  <p className="text-[11px] text-gray-400">
                    The curve is symmetric because C(n, k) = C(n, n−k): picking {report.r} to keep is the same
                    as picking {report.n - report.r} to leave.
                  </p>
                </div>
              )}

              {report.listing && (
                <div className="flex flex-col gap-2">
                  <SectionTitle
                    note={
                      report.listing.truncated
                        ? `first ${
                            listing === 'combinations'
                              ? report.listing.combinations.length
                              : report.listing.permutations.length
                          } shown`
                        : 'all of them'
                    }
                  >
                    The actual selections from {'{'}1…{report.n}
                    {'}'}
                  </SectionTitle>
                  <div className="flex gap-2">
                    {(['combinations', 'permutations'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setListing(mode)}
                        className={`px-3 py-1.5 text-xs border capitalize transition-colors duration-150 cursor-pointer ${
                          listing === mode
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                    <StatusBadge tone="neutral">
                      {listing === 'combinations' ? '{unordered}' : '(ordered)'}
                    </StatusBadge>
                  </div>
                  {listing === 'combinations' ? (
                    <TupleChips rows={report.listing.combinations} brackets={['{', '}']} />
                  ) : (
                    <TupleChips rows={report.listing.permutations} brackets={['(', ')']} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
