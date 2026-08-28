'use client';

import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeQuery,
  buildIndexScript,
  estimateCardinality,
  type CardinalityLevel,
  type IndexSuggestion,
} from './logic';

const EXAMPLE = `SELECT u.id, u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.is_active = 1
  AND o.status = 'completed'
ORDER BY o.created_at DESC
LIMIT 20;`;

const PRESETS = [
  { label: 'join + filter + sort', value: EXAMPLE },
  {
    label: 'two-column filter',
    value: "SELECT id, email FROM users WHERE tenant_id = 42 AND email = 'a@b.com'",
  },
  {
    label: 'group by',
    value: 'SELECT country, COUNT(*) FROM customers GROUP BY country ORDER BY COUNT(*) DESC',
  },
  {
    label: 'leading wildcard',
    value: "SELECT * FROM products WHERE name LIKE '%widget'",
  },
  { label: 'not a SELECT', value: "UPDATE users SET is_active = 0 WHERE id = 7" },
];

const cardinalityTone: Record<CardinalityLevel, BadgeTone> = {
  high: 'pass',
  medium: 'info',
  low: 'warn',
};

const clauseTone: Record<string, BadgeTone> = {
  WHERE: 'info',
  'JOIN ON': 'pass',
  'ORDER BY': 'warn',
  'GROUP BY': 'neutral',
  'WHERE (composite)': 'info',
};

const SuggestionCard = ({ suggestion }: { suggestion: IndexSuggestion }) => {
  const guesses = suggestion.columns.map(c => ({ column: c, ...estimateCardinality(c) }));
  // A B-tree index is only as selective as its leading column, so that is the one that
  // decides whether the planner ever reaches for it — composite or not.
  const weak = guesses[0].level === 'low';

  return (
    <div className="border border-gray-200">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <StatusBadge tone={clauseTone[suggestion.clause] ?? 'neutral'}>
          {suggestion.clause}
        </StatusBadge>
        <StatusBadge tone={suggestion.indexType === 'composite' ? 'info' : 'neutral'}>
          {suggestion.indexType}
        </StatusBadge>
        <span className="font-mono text-xs text-gray-900">
          {suggestion.table} ({suggestion.columns.join(', ')})
        </span>
        <span className="ml-auto">
          <CopyButton text={suggestion.createStatement} label="CREATE INDEX statement" />
        </span>
      </div>

      <pre className="px-3 py-2 overflow-x-auto font-mono text-xs text-gray-900">
        {suggestion.createStatement}
      </pre>

      <div className="border-t border-gray-200 px-3 py-2 flex flex-col gap-2">
        <p className="text-xs text-gray-500">{suggestion.reason}</p>
        <div className="flex flex-wrap gap-1.5">
          {guesses.map(g => (
            <span
              key={g.column}
              title={g.reason}
              className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] ${
                g.level === 'high'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : g.level === 'low'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}
            >
              <span className="font-mono">{g.column}</span>
              <span className="uppercase tracking-widest font-bold">{g.level}</span>
            </span>
          ))}
        </div>
        {weak && (
          <p className="text-[11px] text-amber-700">
            The leading column looks low-cardinality. On its own this index is likely to be skipped
            by the planner — lead with a selective column instead, and keep this one as a trailing
            member of a composite.
          </p>
        )}
        <p className="text-[11px] text-gray-400 font-mono">{suggestion.complexity}</p>
      </div>
    </div>
  );
};

export function DbIndexAdvisor() {
  const [sql, setSql] = useState(EXAMPLE);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setSql(decodeURIComponent(from));
  }, []);

  const analysis = useMemo(() => (sql.trim() ? analyzeQuery(sql) : null), [sql]);
  const script = useMemo(() => (analysis ? buildIndexScript(analysis) : ''), [analysis]);
  const byTable = useMemo(() => {
    if (!analysis) return [];
    const map = new Map<string, IndexSuggestion[]>();
    for (const s of analysis.suggestions) {
      if (!map.has(s.table)) map.set(s.table, []);
      map.get(s.table)!.push(s);
    }
    return Array.from(map.entries());
  }, [analysis]);

  return (
    <Panel
      title="Database Index Advisor"
      description="Paste a [1 SELECT 2] query and get the [1 CREATE INDEX 2] statements it argues for, read off the [1 WHERE 2], [1 JOIN ON 2], [1 ORDER BY 2] and [1 GROUP BY 2] columns — each with a cardinality guess, so you can tell the indexes worth building from the ones the planner will ignore."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
              htmlFor="index-sql-input"
            >
              SQL SELECT query
            </label>
            <textarea
              id="index-sql-input"
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none resize-y transition-colors duration-150 font-mono text-xs"
              rows={9}
              spellCheck={false}
              placeholder={EXAMPLE}
              value={sql}
              onChange={e => setSql(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setSql} />
          </div>

          {analysis && analysis.summary && (
            <>
              <div className="border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-700">{analysis.summary}</p>
              </div>

              {analysis.suggestions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <StatTile label="Indexes" value={analysis.suggestions.length} />
                  <StatTile label="Tables" value={byTable.length} />
                  <StatTile
                    label="Composite"
                    value={analysis.suggestions.filter(s => s.indexType === 'composite').length}
                    hint="Multi-column"
                  />
                  <StatTile
                    label="Low cardinality"
                    value={
                      analysis.suggestions.filter(
                        s => estimateCardinality(s.columns[0]).level === 'low'
                      ).length
                    }
                    hint="Leading column"
                  />
                </div>
              )}

              {analysis.warnings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle>Warnings</SectionTitle>
                  <div className="flex flex-col gap-2">
                    {analysis.warnings.map(w => (
                      <div key={w} className="border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-xs text-gray-700">{w}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {byTable.map(([table, suggestions]) => (
                <div key={table} className="flex flex-col gap-2">
                  <SectionTitle
                    note={`${suggestions.length} index${suggestions.length === 1 ? '' : 'es'}`}
                  >
                    {table}
                  </SectionTitle>
                  <div className="flex flex-col gap-2">
                    {suggestions.map((s, i) => (
                      <SuggestionCard key={`${s.clause}-${s.columns.join('_')}-${i}`} suggestion={s} />
                    ))}
                  </div>
                </div>
              ))}

              {script && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note={<CopyButton text={script} label="index script" />}>
                    Migration script
                  </SectionTitle>
                  <pre className="border border-gray-200 bg-gray-50 px-3 py-3 overflow-x-auto font-mono text-xs text-gray-900">
                    {script}
                  </pre>
                  <p className="text-[11px] text-gray-500">
                    Every index costs write throughput and disk. Add them one at a time and confirm
                    with <span className="font-mono">EXPLAIN</span> that the planner picks each one
                    up — these are candidates, not a shopping list.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionTitle note="Rules of thumb behind the cardinality labels">
                  Cardinality guide
                </SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <StatusBadge tone="pass">High</StatusBadge>
                    <p className="text-xs text-gray-700 mt-1">
                      Many distinct values —{' '}
                      <span className="font-mono">user_id, email, uuid, created_at</span>. An index
                      here narrows the search hard, which is what makes it worth the write cost.
                    </p>
                  </div>
                  <div className="border border-indigo-200 bg-indigo-50 px-3 py-2">
                    <StatusBadge tone="info">Medium</StatusBadge>
                    <p className="text-xs text-gray-700 mt-1">
                      Depends on the data —{' '}
                      <span className="font-mono">name, city, price</span>. Check the real distinct
                      count against the row count before committing.
                    </p>
                  </div>
                  <div className="border border-amber-200 bg-amber-50 px-3 py-2">
                    <StatusBadge tone="warn">Low</StatusBadge>
                    <p className="text-xs text-gray-700 mt-1">
                      A handful of values —{' '}
                      <span className="font-mono">status, is_active, role</span>. Alone the planner
                      usually prefers a table scan; put them after a selective column in a composite.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
