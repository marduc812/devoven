'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parseCronExpression } from './logic';

const EXAMPLES = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every day at midnight', expr: '0 0 * * *' },
  { label: 'Weekdays at 9 AM', expr: '0 9 * * 1-5' },
  { label: 'Every Sunday at noon', expr: '0 12 * * 0' },
  { label: 'First of every month', expr: '0 0 1 * *' },
  { label: '@hourly', expr: '@hourly' },
];

export function CronParser() {
  const [expr, setExpr] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setExpr(from);
  }, []);

  const result = expr.trim() ? parseCronExpression(expr) : null;

  const inputClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';

  const content = (
    <div className="flex flex-col gap-5">
      {/* Input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Cron Expression
        </label>
        <input
          className={inputClass}
          placeholder="e.g. 0 9 * * 1-5  or  @daily"
          value={expr}
          onChange={e => setExpr(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 mt-1">
          {EXAMPLES.map(ex => (
            <button
              key={ex.expr}
              onClick={() => setExpr(ex.expr)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-400 text-xs hover:text-gray-200 hover:border-gray-400 transition-colors font-mono cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {result && !result.valid && (
        <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm font-mono">
          {result.error || 'Invalid cron expression'}
        </div>
      )}

      {/* Results */}
      {result && result.valid && (
        <>
          {/* Human readable */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Human Readable
            </label>
            <div className="bg-gray-50 px-4 py-3 border border-gray-200 text-gray-900 text-sm">
              {result.humanReadable}
            </div>
          </div>

          {/* Field breakdown */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Field Breakdown
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.fields.map((field, i) => (
                <div
                  key={i}
                  className="flex flex-col border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">
                    {field.name}
                  </span>
                  <span className="text-gray-900 font-mono text-sm">{field.raw}</span>
                  <span className="text-gray-400 text-xs mt-1">{field.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next runs */}
          {result.nextRuns.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Next 5 Run Times (UTC)
              </label>
              <ul className="flex flex-col gap-1">
                {result.nextRuns.map((run, i) => (
                  <li
                    key={i}
                    className="bg-gray-50 px-4 py-2 border border-gray-200 text-gray-900 font-mono text-sm"
                  >
                    {i + 1}. {run}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {!result && (
        <div className="text-gray-600 text-sm">
          Enter a cron expression above to see its explanation and next run times.
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="Cron Expression Parser"
      description="Parse a cron expression (5 or 6 fields) and get a human-readable explanation plus the next 5 scheduled run times. Supports [1 * / 2], [1 ranges 2], [1 steps 2], and special strings like [1 @daily 2]."
      backColor="lime"
      extraElements={content}
    />
  );
}
