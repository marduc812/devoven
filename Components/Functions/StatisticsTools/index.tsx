'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  BarChart,
  BoxPlot,
  CopyButton,
  ErrorNote,
  Meter,
  PresetRow,
  ResultTable,
  SectionTitle,
  StatTile,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  computeFullStats,
  formatStatValue as fmt,
  parseNumbers,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  { label: 'Dice rolls', value: '3, 5, 2, 6, 6, 1, 4, 5, 3, 6, 2, 4, 5, 5, 1, 3' },
  { label: 'Survey ratings', value: '5, 4, 5, 3, 5, 4, 4, 5, 2, 5, 4, 3, 5, 5, 4' },
  { label: 'Measurements', value: '10.2, 10.5, 9.8, 10.1, 10.4, 9.9, 10.3, 10.0' },
];

export function StatisticsCalculator() {
  const [input, setInput] = useState('');

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
      return { result: computeFullStats(parseNumbers(input)), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [input]);

  // Charting every distinct value stops being readable past a few dozen bars.
  const chartable = result !== null && result.frequencyDist.length <= 40;

  return (
    <Panel
      title="Statistics Calculator"
      description="Paste comma or newline separated numbers. Computes count, sum, min, max, mean, median, mode, variance, standard deviation, quartiles [1 Q1, Q2, Q3 2], IQR and a full frequency distribution."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Numbers <span className="font-normal text-gray-400 normal-case">comma or newline separated</span>
            </label>
            <FileTextArea>
              <textarea
                className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full h-36 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 font-mono text-sm resize-y"
                placeholder="3, 5, 2, 6, 6, 1&#10;4, 5, 3"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </FileTextArea>
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              {/* Overview */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                <StatTile
                  label="Count"
                  value={result.count}
                  hint={`${result.frequencyDist.length} distinct`}
                />
                <StatTile label="Sum" value={fmt(result.sum)} />
                <StatTile label="Min" value={fmt(result.min)} />
                <StatTile label="Max" value={fmt(result.max)} />
                <StatTile label="Range" value={fmt(result.range)} hint="max − min" />
              </div>

              {/* Central tendency */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={
                    result.mean === result.median
                      ? 'mean equals median — symmetric'
                      : result.mean > result.median
                        ? 'mean above median — right-skewed'
                        : 'mean below median — left-skewed'
                  }
                >
                  Central tendency
                </SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <StatTile label="Mean" value={fmt(result.mean)} hint="arithmetic average" />
                  <StatTile label="Median" value={fmt(result.median)} hint="middle value" />
                  <StatTile
                    label="Mode"
                    value={result.modeFreq === 1 ? '—' : result.mode.map(fmt).join(', ')}
                    hint={
                      result.modeFreq === 1
                        ? 'no value repeats'
                        : `appears ${result.modeFreq}×${result.mode.length > 1 ? `, ${result.mode.length}-way tie` : ''}`
                    }
                  />
                </div>
              </div>

              {/* Spread */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="quartiles use the inclusive method">Spread</SectionTitle>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
                  <StatTile label="Variance" value={fmt(result.variance)} hint="population σ²" />
                  <StatTile label="Std deviation" value={fmt(result.stdDev)} hint="population σ" />
                  <StatTile label="Q1" value={fmt(result.q1)} hint="25th pct" />
                  <StatTile label="Q2" value={fmt(result.q2)} hint="50th pct" />
                  <StatTile label="Q3" value={fmt(result.q3)} hint="75th pct" />
                  <StatTile label="IQR" value={fmt(result.iqr)} hint="Q3 − Q1" />
                </div>
                <BoxPlot
                  min={result.min}
                  q1={result.q1}
                  median={result.q2}
                  q3={result.q3}
                  max={result.max}
                  format={fmt}
                />
              </div>

              {/* Frequency distribution */}
              <div className="flex flex-col gap-3">
                <SectionTitle
                  note={
                    chartable
                      ? `${result.frequencyDist.length} distinct value${result.frequencyDist.length === 1 ? '' : 's'}`
                      : `${result.frequencyDist.length} distinct values — too many to chart`
                  }
                >
                  Frequency distribution
                </SectionTitle>

                {chartable && (
                  <BarChart
                    bars={result.frequencyDist.map(d => ({
                      label: fmt(d.value),
                      value: d.freq,
                      title: `${fmt(d.value)} — ${d.freq}× (${d.pct})`,
                    }))}
                  />
                )}

                <ResultTable
                  headers={['Value', 'Frequency', 'Share', '']}
                  align={['left', 'right', 'right', 'left']}
                  rows={result.frequencyDist.map(d => [
                    <span key="v" className={result.mode.includes(d.value) && result.modeFreq > 1 ? 'font-bold text-gray-900' : ''}>
                      {fmt(d.value)}
                    </span>,
                    d.freq,
                    <span key="p" className="text-gray-500">{d.pct}</span>,
                    <div key="m" className="min-w-[80px]">
                      <Meter
                        ratio={d.freq / result.modeFreq}
                        tone={result.mode.includes(d.value) && result.modeFreq > 1 ? 'pass' : 'info'}
                      />
                    </div>,
                  ])}
                />
              </div>

              {/* Sorted data */}
              <div className="flex flex-col gap-3">
                <SectionTitle note={<CopyButton text={result.sorted.map(fmt).join(', ')} label="sorted data" />}>
                  Sorted data
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
