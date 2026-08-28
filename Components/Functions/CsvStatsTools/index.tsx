'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ErrorNote,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzeCsv, type ColumnStats } from './logic';

const SALES_CSV = `date,region,units,revenue,rep
2024-01-05,North,12,1440.00,Ada
2024-01-09,South,7,910.50,Alan
2024-01-14,North,19,2280.00,Ada
2024-01-22,East,4,512.75,Grace
2024-02-02,South,15,1875.00,Alan
2024-02-11,East,,0.00,Grace
2024-02-18,North,22,2640.00,Katherine`;

const LOG_CSV = `timestamp,status,latency_ms,path
2024-05-01T10:00,200,132,/api/users
2024-05-01T10:01,200,128,/api/users
2024-05-01T10:02,500,1840,/api/orders
2024-05-01T10:03,200,141,/api/users
2024-05-01T10:04,404,22,/api/missing
2024-05-01T10:05,200,135,/api/orders`;

const PRESETS = [
  { label: 'Sales data', value: SALES_CSV },
  { label: 'Request log', value: LOG_CSV },
];

const TYPE_TONE: Record<ColumnStats['type'], BadgeTone> = {
  number: 'info',
  date: 'warn',
  string: 'neutral',
};

/** Trim float noise without dropping meaningful precision. */
const fmt = (n: number): string =>
  Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(4)).toString();

const NumericCard = ({ col }: { col: ColumnStats }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs border-t border-gray-200 pt-3">
    {[
      { label: 'Min', value: col.min },
      { label: 'Max', value: col.max },
      { label: 'Mean', value: col.mean },
      { label: 'Median', value: col.median },
    ].map(s => (
      <div key={s.label}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {s.label}
        </div>
        <div className="text-gray-900 font-bold break-all">
          {s.value !== undefined ? fmt(s.value) : '—'}
        </div>
      </div>
    ))}
  </div>
);

const ColumnCard = ({ col, rowCount }: { col: ColumnStats; rowCount: number }) => {
  const completeness = rowCount === 0 ? 0 : col.count / rowCount;
  const isKey = rowCount > 0 && col.uniqueCount === rowCount && col.nullCount === 0;

  return (
    <div className="border border-gray-200 flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <span className="font-mono text-sm font-bold text-gray-900 truncate">
          {col.name || <span className="text-gray-400 italic">unnamed</span>}
        </span>
        <StatusBadge tone={TYPE_TONE[col.type]}>{col.type}</StatusBadge>
      </div>

      <div className="px-3 py-3 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filled</div>
            <div className="text-gray-900 font-bold">{col.count}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Empty</div>
            <div className="text-gray-900 font-bold">{col.nullCount}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Unique</div>
            <div className="text-gray-900 font-bold">{col.uniqueCount}</div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between font-mono text-[10px] text-gray-500">
            <span>Completeness</span>
            <span>{Math.round(completeness * 100)}%</span>
          </div>
          <Meter
            ratio={completeness}
            tone={col.nullCount === 0 ? 'pass' : completeness < 0.5 ? 'fail' : 'warn'}
          />
        </div>

        {col.type === 'number' && col.min !== undefined && <NumericCard col={col} />}

        {col.sampleValues.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Samples
            </div>
            <div className="flex flex-wrap gap-1">
              {col.sampleValues.map((v, i) => (
                <span
                  key={i}
                  title={v}
                  className="font-mono text-[11px] px-1.5 py-0.5 border border-gray-200 text-gray-600 max-w-[160px] truncate"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {isKey && (
          <span className="text-[10px] text-gray-400">
            Every value is distinct — a candidate key.
          </span>
        )}
      </div>
    </div>
  );
};

export const CsvStats = () => {
  const [input, setInput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  const { analysis, error } = useMemo(() => {
    if (!input.trim()) return { analysis: null, error: '' };
    try {
      return { analysis: analyzeCsv(input.trim()), error: '' };
    } catch (e) {
      return { analysis: null, error: e instanceof Error ? e.message : 'Invalid CSV' };
    }
  }, [input]);

  const totals = useMemo(() => {
    if (!analysis) return null;
    const cells = analysis.rowCount * analysis.columnCount;
    const empty = analysis.columns.reduce((a, c) => a + c.nullCount, 0);
    return {
      cells,
      empty,
      numeric: analysis.columns.filter(c => c.type === 'number').length,
    };
  }, [analysis]);

  return (
    <Panel
      title="CSV Column Statistics"
      description="Paste a [1 CSV 2] file with a header row. Each column gets type detection, a filled/empty breakdown, unique counts, sample values, and [1 min/max/mean/median 2] for numeric columns."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              CSV input <span className="font-normal text-gray-400 normal-case">first row is the header</span>
            </label>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-44 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
              placeholder={'date,region,units\n2024-01-05,North,12'}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {analysis && totals && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile label="Rows" value={analysis.rowCount} />
                <StatTile label="Columns" value={analysis.columnCount} />
                <StatTile
                  label="Numeric columns"
                  value={totals.numeric}
                  hint={`${analysis.columnCount - totals.numeric} non-numeric`}
                />
                <StatTile
                  label="Empty cells"
                  value={totals.empty}
                  hint={
                    totals.cells > 0
                      ? `${Math.round((totals.empty / totals.cells) * 100)}% of ${totals.cells}`
                      : undefined
                  }
                />
              </div>

              <div className="flex flex-col gap-3">
                <SectionTitle note="type is inferred from the non-empty values">Columns</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {analysis.columns.map((col, i) => (
                    <ColumnCard key={`${col.name}-${i}`} col={col} rowCount={analysis.rowCount} />
                  ))}
                </div>
              </div>

              {totals.numeric > 0 && (
                <div className="flex flex-col gap-3">
                  <SectionTitle>Numeric summary</SectionTitle>
                  <ResultTable
                    headers={['Column', 'Min', 'Max', 'Mean', 'Median', 'Values']}
                    align={['left', 'right', 'right', 'right', 'right', 'right']}
                    rows={analysis.columns
                      .filter(c => c.type === 'number' && c.min !== undefined)
                      .map((c, i) => [
                        <span key={`n${i}`} className="font-bold">{c.name}</span>,
                        fmt(c.min!),
                        fmt(c.max!),
                        c.mean !== undefined ? fmt(c.mean) : '—',
                        c.median !== undefined ? fmt(c.median) : '—',
                        c.count,
                      ])}
                  />
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
