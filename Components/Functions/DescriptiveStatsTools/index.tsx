'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  BarChart,
  BoxPlot,
  CopyButton,
  ErrorNote,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  computeStats,
  formatStatValue as fmt,
  histogram,
  parseNumbers,
} from './logic';

const PRESETS = [
  { label: 'Test scores', value: '72, 88, 91, 65, 78, 95, 83, 70, 88, 60, 77, 84' },
  { label: 'Response times (ms)', value: '120, 135, 128, 890, 142, 131, 125, 139, 1200, 133' },
  { label: 'Uniform', value: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10' },
];

export function DescriptiveStatsCalculator() {
  const [input, setInput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const { result, error } = useMemo(() => {
    if (!input.trim()) return { result: null, error: '' };
    try {
      return { result: computeStats(parseNumbers(input)), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input]);

  const bins = useMemo(() => (result ? histogram(result.sorted) : []), [result]);

  // Coefficient of variation is only meaningful when the mean is away from zero.
  const cv = result && result.mean !== 0 ? (result.stdDev / Math.abs(result.mean)) * 100 : null;

  return (
    <Panel
      title="Descriptive Statistics Calculator"
      description="Paste numbers separated by newlines or commas. Computes count, sum, mean, median, mode, range, variance, standard deviation and percentiles ([1 25th 2], [1 75th 2], [1 90th 2], [1 95th 2]), with a distribution chart and box plot."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Numbers <span className="font-normal text-gray-400 normal-case">one per line or comma-separated</span>
            </label>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-36 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
              placeholder="72, 88, 91, 65, 78&#10;95, 83, 70"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              {/* Central tendency */}
              <div className="flex flex-col gap-3">
                <SectionTitle note={`${result.count} value${result.count === 1 ? '' : 's'}`}>
                  Central tendency
                </SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <StatTile label="Mean" value={fmt(result.mean)} hint="arithmetic average" />
                  <StatTile label="Median" value={fmt(result.median)} hint="50th percentile" />
                  <StatTile
                    label="Mode"
                    value={
                      result.mode.length === result.sorted.length
                        ? '—'
                        : result.mode.map(fmt).join(', ')
                    }
                    hint={
                      result.mode.length === result.sorted.length
                        ? 'every value is unique'
                        : result.mode.length > 1
                          ? `${result.mode.length}-way tie`
                          : 'most frequent'
                    }
                  />
                  <StatTile label="Sum" value={fmt(result.sum)} />
                </div>
              </div>

              {/* Spread */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={cv !== null ? `coefficient of variation ${fmt(Math.round(cv * 100) / 100)}%` : undefined}
                >
                  Spread
                </SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                  <StatTile label="Min" value={fmt(result.min)} />
                  <StatTile label="Max" value={fmt(result.max)} />
                  <StatTile label="Range" value={fmt(result.range)} hint="max − min" />
                  <StatTile label="Std deviation" value={fmt(result.stdDev)} hint="population σ" />
                  <StatTile label="Variance" value={fmt(result.variance)} hint="σ²" />
                </div>
              </div>

              {/* Distribution */}
              <div className="flex flex-col gap-3">
                <SectionTitle note={`${bins.length} bin${bins.length === 1 ? '' : 's'}`}>
                  Distribution
                </SectionTitle>
                <BarChart
                  bars={bins.map(b => ({
                    label: fmt(Math.round(b.start * 100) / 100),
                    value: b.count,
                    title: `${fmt(b.start)} – ${fmt(b.end)}: ${b.count} value${b.count === 1 ? '' : 's'}`,
                  }))}
                />
              </div>

              {/* Five-number summary */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="box spans the interquartile range, line marks the median">
                  Five-number summary
                </SectionTitle>
                <BoxPlot
                  min={result.min}
                  q1={result.p25}
                  median={result.median}
                  q3={result.p75}
                  max={result.max}
                  format={fmt}
                />
              </div>

              {/* Percentiles */}
              <div className="flex flex-col gap-3">
                <SectionTitle>Percentiles</SectionTitle>
                <ResultTable
                  headers={['Percentile', 'Value', 'Meaning']}
                  align={['left', 'right', 'left']}
                  rows={[
                    ['25th', fmt(result.p25), 'a quarter of values fall below'],
                    ['50th (median)', fmt(result.median), 'half of values fall below'],
                    ['75th', fmt(result.p75), 'three quarters fall below'],
                    ['90th', fmt(result.p90), 'the top tenth starts here'],
                    ['95th', fmt(result.p95), 'common latency budget cutoff'],
                  ].map(([a, b, c]) => [
                    a,
                    <span key="v" className="font-bold">{b}</span>,
                    <span key="m" className="text-gray-500 font-sans">{c}</span>,
                  ])}
                />
                <div className="font-mono text-[11px] text-gray-500">
                  IQR (p75 − p25) = {fmt(result.p75 - result.p25)}
                </div>
              </div>

              {/* Sorted values */}
              <div className="flex flex-col gap-3">
                <SectionTitle note={<CopyButton text={result.sorted.map(fmt).join(', ')} label="sorted values" />}>
                  Sorted values
                </SectionTitle>
                <div className="border border-gray-200 bg-gray-50 px-3 py-2 max-h-40 overflow-y-auto font-mono text-xs text-gray-700 break-all">
                  {result.sorted.map(fmt).join(', ')}
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
