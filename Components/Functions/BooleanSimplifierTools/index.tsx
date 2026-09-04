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
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  generateTruthTable,
  karnaughMap,
  type BooleanResult,
  type KarnaughMap,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'A && B', value: 'A && B' },
  { label: 'A || !B', value: 'A || !B' },
  { label: 'A ^ B ^ C', value: 'A ^ B ^ C' },
  { label: 'Majority', value: '(A && B) || (B && C) || (A && C)' },
  { label: 'Tautology', value: 'A || !A' },
  { label: '4-var', value: '(A && B) || (!C && D)' },
];

const OPERATORS = [
  { symbol: '&&', name: 'AND' },
  { symbol: '||', name: 'OR' },
  { symbol: '!', name: 'NOT' },
  { symbol: '^', name: 'XOR' },
  { symbol: 'NAND', name: 'NAND' },
  { symbol: 'NOR', name: 'NOR' },
  { symbol: 'XNOR', name: 'XNOR' },
];

const Bit = ({ on }: { on: boolean }) => (
  <span className={on ? 'text-emerald-700 font-bold' : 'text-gray-400'}>{on ? '1' : '0'}</span>
);

const TruthTable = ({ result }: { result: BooleanResult }) => (
  <div className="border border-gray-200 overflow-x-auto">
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-gray-50">
          <th className="px-3 py-2 text-left font-bold uppercase tracking-widest text-[10px] text-gray-400 w-10">
            #
          </th>
          {result.variables.map(v => (
            <th
              key={v}
              className="px-3 py-2 text-center font-mono font-bold text-sm text-gray-900 w-12"
            >
              {v}
            </th>
          ))}
          <th className="px-3 py-2 text-center font-bold uppercase tracking-widest text-[10px] text-gray-500 border-l border-gray-200">
            Output
          </th>
        </tr>
      </thead>
      <tbody>
        {result.rows.map((row, i) => (
          <tr key={i} className={`border-t border-gray-200 ${row.output ? 'bg-emerald-50' : ''}`}>
            <td className="px-3 py-1.5 font-mono text-[10px] text-gray-400">{i}</td>
            {result.variables.map(v => (
              <td key={v} className="px-3 py-1.5 text-center font-mono">
                <Bit on={row.vars[v]} />
              </td>
            ))}
            <td className="px-3 py-1.5 text-center font-mono border-l border-gray-200">
              <Bit on={row.output} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const KMap = ({ map }: { map: KarnaughMap }) => (
  <div className="inline-block border border-gray-200 p-3 overflow-x-auto">
    <table className="border-collapse">
      <thead>
        <tr>
          <th className="px-2 py-1 text-left font-mono text-[10px] text-gray-400 align-bottom whitespace-nowrap">
            {map.rowVars.join('')}
            {map.rowVars.length > 0 && ' \\ '}
            {map.colVars.join('')}
          </th>
          {map.colLabels.map(label => (
            <th key={label} className="px-1 pb-1 font-mono text-[10px] text-gray-400 text-center">
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {map.cells.map((row, r) => (
          <tr key={r}>
            <th className="px-2 font-mono text-[10px] text-gray-400 text-right">
              {map.rowLabels[r]}
            </th>
            {row.map(cell => (
              <td key={cell.minterm} className="p-0">
                <div
                  title={`Minterm ${cell.minterm} → ${cell.value ? '1' : '0'}`}
                  className={`w-12 h-12 border flex flex-col items-center justify-center font-mono ${
                    cell.value
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  <span className="text-base font-bold leading-none">{cell.value ? '1' : '0'}</span>
                  <span className="text-[9px] text-gray-400 leading-none mt-0.5">
                    m{cell.minterm}
                  </span>
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export function BooleanSimplifier() {
  const [input, setInput] = useState('(A && B) || (B && C) || (A && C)');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' };
    try {
      return { result: generateTruthTable(input), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input]);

  const map = useMemo(() => (result ? karnaughMap(result) : null), [result]);

  const classification = result
    ? result.minterms.length === 0
      ? { label: 'Contradiction', tone: 'fail' as const, note: 'false for every input' }
      : result.minterms.length === result.rows.length
        ? { label: 'Tautology', tone: 'pass' as const, note: 'true for every input' }
        : { label: 'Contingent', tone: 'info' as const, note: 'depends on the inputs' }
    : null;

  return (
    <Panel
      title="Boolean Expression Simplifier"
      description="Build a [1 truth table 2] and [1 Karnaugh map 2] for any expression over variables A–D. Supports AND (&&), OR (||), NOT (!), XOR (^), NAND, NOR and XNOR, and derives the canonical Sum of Products."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <input
              className={inputClass}
              placeholder="A && B || !C"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Operators
              </span>
              {OPERATORS.map(op => (
                <span
                  key={op.symbol}
                  className="font-mono text-[11px] px-1.5 py-0.5 border border-gray-200 text-gray-500"
                >
                  {op.symbol}
                  <span className="text-gray-400"> {op.name}</span>
                </span>
              ))}
            </div>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && classification && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label="Classification"
                  value={<StatusBadge tone={classification.tone}>{classification.label}</StatusBadge>}
                  hint={classification.note}
                />
                <StatTile
                  label="Variables"
                  value={result.variables.join(', ')}
                  hint={`${result.rows.length} combinations`}
                />
                <StatTile
                  label="True rows"
                  value={`${result.minterms.length} / ${result.rows.length}`}
                  hint={`${Math.round((result.minterms.length / result.rows.length) * 100)}% of inputs`}
                />
                <StatTile
                  label="Minterms"
                  value={result.minterms.length > 0 ? result.minterms.join(', ') : '—'}
                  hint={result.minterms.length > 0 ? 'rows where output is 1' : 'never true'}
                />
              </div>

              <div className="flex flex-col xl:flex-row gap-6 xl:items-start">
                {/* Truth table */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <SectionTitle note="rows where the output is 1 are highlighted">
                    Truth table
                  </SectionTitle>
                  <TruthTable result={result} />
                </div>

                {/* K-map */}
                {map && (
                  <div className="flex flex-col gap-3">
                    <SectionTitle note="Gray-coded — adjacent cells differ by one variable">
                      Karnaugh map
                    </SectionTitle>
                    <KMap map={map} />
                    <p className="text-[11px] text-gray-400 max-w-xs">
                      Neighbouring 1s (including across the edges) form groups that collapse into a
                      simpler term.
                    </p>
                  </div>
                )}
              </div>

              {/* SOP */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="one AND term per row where the output is 1">
                  Canonical Sum of Products
                </SectionTitle>
                <div className="flex items-start justify-between gap-3 border border-gray-200 bg-gray-50 px-3 py-3">
                  <code className="font-mono text-sm text-gray-900 break-all">{result.sop}</code>
                  <CopyButton text={result.sop} label="SOP expression" />
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
