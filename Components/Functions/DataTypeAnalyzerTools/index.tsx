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
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeColumns,
  type ColumnStats,
  type InferredType,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const SAMPLE_CSV = `id,name,email,signup_date,active,score,notes
1,Ada Lovelace,ada@example.com,2024-01-15,true,91.5,first user
2,Alan Turing,alan@example.com,2024-02-03,true,88.2,
3,Grace Hopper,grace@example.com,2024-02-19,false,,on leave
4,Katherine Johnson,kj@example.com,2024-03-01,true,95.0,promoted
5,Edsger Dijkstra,,2024-03-11,false,72.4,N/A`;

const MESSY_CSV = `sku,price,in_stock,category,url
A-100,19.99,yes,tools,https://example.com/a100
A-101,5.00,no,tools,https://example.com/a101
B-200,,yes,garden,https://example.com/b200
B-201,45.50,yes,garden,
C-300,12.25,no,tools,https://example.com/c300`;

const PRESETS = [
  { label: 'User table', value: SAMPLE_CSV },
  { label: 'Product table', value: MESSY_CSV },
];

const TYPE_TONE: Record<InferredType, BadgeTone> = {
  integer: 'info',
  float: 'info',
  boolean: 'pass',
  date: 'warn',
  email: 'pass',
  url: 'pass',
  categorical: 'neutral',
  'free text': 'neutral',
  empty: 'fail',
};

const ColumnCard = ({ col }: { col: ColumnStats }) => {
  const nonNull = col.totalCount - col.nullCount;
  const nullRatio = col.totalCount === 0 ? 0 : col.nullCount / col.totalCount;
  const uniqueRatio = col.totalCount === 0 ? 0 : col.uniqueCount / col.totalCount;

  const range =
    col.minValue !== undefined && col.maxValue !== undefined
      ? `${col.minValue} … ${col.maxValue}`
      : col.minStr !== undefined
        ? `${col.minStr} … ${col.maxStr}`
        : null;

  return (
    <div className="border border-gray-200 flex flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <span className="font-mono text-sm font-bold text-gray-900 truncate">
          {col.name || <span className="text-gray-400 italic">unnamed</span>}
        </span>
        <StatusBadge tone={TYPE_TONE[col.inferredType]}>{col.inferredType}</StatusBadge>
      </div>

      <div className="px-3 py-3 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-3 font-mono text-xs">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Rows</div>
            <div className="text-gray-900 font-bold">{col.totalCount}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filled</div>
            <div className="text-gray-900 font-bold">{nonNull}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Unique</div>
            <div className="text-gray-900 font-bold">{col.uniqueCount}</div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between font-mono text-[10px] text-gray-500">
            <span>Completeness</span>
            <span>{Math.round((1 - nullRatio) * 100)}%</span>
          </div>
          <Meter
            ratio={1 - nullRatio}
            tone={nullRatio === 0 ? 'pass' : nullRatio > 0.5 ? 'fail' : 'warn'}
          />
          {col.nullCount > 0 && (
            <span className="text-[10px] text-gray-400">
              {col.nullCount} null or empty value{col.nullCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {range && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              {col.minValue !== undefined ? 'Range' : 'Range (alphabetical)'}
            </div>
            <div className="font-mono text-xs text-gray-900 break-all">{range}</div>
          </div>
        )}

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

        {uniqueRatio === 1 && col.nullCount === 0 && (
          <span className="text-[10px] text-gray-400">
            Every value is distinct — a candidate key.
          </span>
        )}
      </div>
    </div>
  );
};

export function DataTypeAnalyzer() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const { columns, error } = useMemo(() => {
    if (!input.trim()) return { columns: null, error: '' };
    try {
      return { columns: analyzeColumns(input), error: '' };
    } catch (e) {
      return { columns: null, error: (e as Error).message };
    }
  }, [input]);

  const summary = useMemo(() => {
    if (!columns || columns.length === 0) return null;
    const rows = columns[0].totalCount;
    const totalCells = rows * columns.length;
    const totalNulls = columns.reduce((a, c) => a + c.nullCount, 0);
    const typeCounts = columns.reduce<Record<string, number>>((acc, c) => {
      acc[c.inferredType] = (acc[c.inferredType] || 0) + 1;
      return acc;
    }, {});
    return { rows, totalCells, totalNulls, typeCounts };
  }, [columns]);

  return (
    <Panel
      title="Data Type Analyzer"
      description="Paste [1 CSV data with a header row 2]. Every column's type is inferred as [1 integer 2], [1 float 2], [1 boolean 2], [1 date 2], [1 email 2], [1 URL 2], [1 categorical 2] or [1 free text 2], with completeness, unique counts, ranges and sample values per column."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              CSV data <span className="font-normal text-gray-400 normal-case">first row is the header</span>
            </label>
            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-44 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
                placeholder={'id,name,email\n1,Ada,ada@example.com'}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </FileTextArea>
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {columns && summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile label="Columns" value={columns.length} />
                <StatTile label="Rows" value={summary.rows} />
                <StatTile
                  label="Null cells"
                  value={summary.totalNulls}
                  hint={
                    summary.totalCells > 0
                      ? `${Math.round((summary.totalNulls / summary.totalCells) * 100)}% of ${summary.totalCells} cells`
                      : undefined
                  }
                />
                <StatTile
                  label="Complete columns"
                  value={columns.filter(c => c.nullCount === 0).length}
                  hint="no missing values"
                />
              </div>

              {/* Type mix */}
              <div className="flex flex-col gap-2">
                <SectionTitle note="inferred from the dominant cell type in each column">
                  Type mix
                </SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(summary.typeCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <StatusBadge key={type} tone={TYPE_TONE[type as InferredType]}>
                        {type} × {count}
                      </StatusBadge>
                    ))}
                </div>
              </div>

              {/* Per-column detail */}
              <div className="flex flex-col gap-3">
                <SectionTitle>Columns</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {columns.map((col, i) => (
                    <ColumnCard key={`${col.name}-${i}`} col={col} />
                  ))}
                </div>
              </div>

              {/* Compact overview */}
              <div className="flex flex-col gap-3">
                <SectionTitle>Summary</SectionTitle>
                <ResultTable
                  headers={['Column', 'Type', 'Nulls', 'Unique', 'Completeness']}
                  align={['left', 'left', 'right', 'right', 'left']}
                  rows={columns.map((col, i) => [
                    <span key={`n${i}`} className="font-bold">{col.name || '—'}</span>,
                    <StatusBadge key={`t${i}`} tone={TYPE_TONE[col.inferredType]}>
                      {col.inferredType}
                    </StatusBadge>,
                    col.nullCount,
                    col.uniqueCount,
                    <div key={`m${i}`} className="min-w-[100px]">
                      <Meter
                        ratio={col.totalCount === 0 ? 0 : 1 - col.nullCount / col.totalCount}
                        tone={col.nullCount === 0 ? 'pass' : 'warn'}
                      />
                    </div>,
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
