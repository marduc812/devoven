'use client';

import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import {
  analyzeSql,
  auditSql,
  tokenizeSql,
  type SqlIssue,
  type SqlTokenKind,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PRESETS = [
  {
    label: 'join + group',
    value:
      "SELECT u.name, COUNT(o.id) AS orders, SUM(o.total) AS spend\nFROM users u\nJOIN orders o ON u.id = o.user_id\nWHERE u.created_at > '2024-01-01'\nGROUP BY u.name\nHAVING COUNT(o.id) > 3\nORDER BY spend DESC\nLIMIT 20;",
  },
  { label: 'select *', value: "SELECT * FROM products WHERE name LIKE '%widget' ORDER BY price" },
  { label: 'update', value: "UPDATE users SET is_active = 0 WHERE last_login < '2023-01-01'" },
  { label: 'unsafe delete', value: 'DELETE FROM sessions' },
  { label: 'insert', value: "INSERT INTO logs (level, message) VALUES ('warn', 'disk almost full')" },
];

const tokenClass: Record<SqlTokenKind, string> = {
  keyword: 'text-indigo-700 font-bold',
  function: 'text-fuchsia-700',
  string: 'text-emerald-700',
  number: 'text-amber-700',
  comment: 'text-gray-400 italic',
  operator: 'text-gray-500',
  punctuation: 'text-gray-500',
  identifier: 'text-gray-900',
  whitespace: '',
};

const severityTone: Record<SqlIssue['severity'], BadgeTone> = {
  high: 'fail',
  medium: 'warn',
  low: 'info',
};

const severitySurface: Record<SqlIssue['severity'], string> = {
  high: 'bg-rose-50 border-rose-200',
  medium: 'bg-amber-50 border-amber-200',
  low: 'bg-indigo-50 border-indigo-200',
};

const statementTone: Record<string, BadgeTone> = {
  SELECT: 'info',
  INSERT: 'pass',
  UPDATE: 'warn',
  DELETE: 'fail',
  CREATE: 'pass',
  ALTER: 'warn',
  DROP: 'fail',
  TRUNCATE: 'fail',
  UNKNOWN: 'neutral',
};

const HighlightedSql = ({ sql }: { sql: string }) => (
  <pre className="border border-gray-200 bg-gray-50 px-3 py-3 overflow-x-auto font-mono text-xs leading-relaxed">
    {tokenizeSql(sql).map((t, i) => (
      <span key={i} className={tokenClass[t.kind]}>
        {t.text}
      </span>
    ))}
  </pre>
);

/** A list where each row is a short label plus a fuller line of prose. */
const ChipList = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-1.5">
    {items.map((item, i) => (
      <span key={`${item}-${i}`} className="font-mono text-xs border border-gray-200 px-2 py-1 text-gray-900 break-all">
        {item}
      </span>
    ))}
  </div>
);

export function SqlAnalyzer() {
  const [sql, setSql] = useState(PRESETS[0].value);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setSql(decodeURIComponent(from));
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: sql })

  const { analysis, issues, error } = useMemo(() => {
    if (!sql.trim()) return { analysis: null, issues: [], error: '' };
    try {
      return { analysis: analyzeSql(sql), issues: auditSql(sql), error: '' };
    } catch (e) {
      return {
        analysis: null,
        issues: [],
        error: e instanceof Error ? e.message : 'Invalid SQL',
      };
    }
  }, [sql]);

  return (
    <Panel
      title="SQL Query Analyzer"
      description="Paste a query and see it taken apart — statement type, tables, columns, joins and conditions, each clause explained in a sentence, plus the query re-formatted and graded warnings. Handles [1 SELECT 2], [1 INSERT 2], [1 UPDATE 2] and [1 DELETE 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
              htmlFor="sql-input"
            >
              SQL query
            </label>
            <textarea
              id="sql-input"
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none resize-y transition-colors duration-150 font-mono text-xs"
              rows={9}
              spellCheck={false}
              placeholder="SELECT id, name FROM users WHERE is_active = 1"
              value={sql}
              onChange={e => setSql(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setSql} />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {analysis && analysis.statementType && (
            <>
              <div className="border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <StatusBadge tone={statementTone[analysis.statementType] ?? 'neutral'}>
                    {analysis.statementType}
                  </StatusBadge>
                  {issues.some(i => i.severity === 'high') && (
                    <StatusBadge tone="fail">Destructive — read the warnings</StatusBadge>
                  )}
                </div>
                <p className="text-sm text-gray-700">{analysis.summary}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <StatTile label="Tables" value={analysis.tables.length} />
                <StatTile label="Columns" value={analysis.columns.length} hint="Selected" />
                <StatTile label="Joins" value={analysis.joins.length} />
                <StatTile label="Conditions" value={analysis.conditions.length} hint="In WHERE" />
                <StatTile label="Aggregates" value={analysis.aggregates.length} />
              </div>

              {issues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note={`${issues.length} finding${issues.length === 1 ? '' : 's'}`}>
                    Warnings
                  </SectionTitle>
                  <div className="flex flex-col gap-2">
                    {issues.map(issue => (
                      <div key={issue.title} className={`border px-3 py-2 ${severitySurface[issue.severity]}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <StatusBadge tone={severityTone[issue.severity]}>
                            {issue.severity}
                          </StatusBadge>
                          <span className="text-xs font-bold text-gray-900">{issue.title}</span>
                        </div>
                        <p className="text-xs text-gray-700">{issue.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <SectionTitle
                  note={<CopyButton text={analysis.formattedSql} label="formatted SQL" />}
                >
                  Formatted
                </SectionTitle>
                <HighlightedSql sql={analysis.formattedSql} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.tables.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionTitle>Tables</SectionTitle>
                    <ChipList items={analysis.tables} />
                  </div>
                )}
                {analysis.columns.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionTitle note="Capped at ten">Selected columns</SectionTitle>
                    <ChipList items={analysis.columns} />
                  </div>
                )}
                {analysis.aggregates.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionTitle>Aggregates</SectionTitle>
                    <ChipList items={analysis.aggregates} />
                  </div>
                )}
                {analysis.conditions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <SectionTitle note="Split at the top level">WHERE conditions</SectionTitle>
                    <ChipList items={analysis.conditions} />
                  </div>
                )}
              </div>

              {analysis.joins.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle>Joins</SectionTitle>
                  <div className="flex flex-col gap-1.5">
                    {analysis.joins.map((j, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 px-3 py-2 font-mono text-xs text-gray-900 break-all"
                      >
                        {j}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.clauses.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="What each part of the query does">
                    Clause by clause
                  </SectionTitle>
                  <div className="flex flex-col gap-2">
                    {analysis.clauses.map((clause, i) => (
                      <div key={`${clause.name}-${i}`} className="border border-gray-200 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 mb-1">
                          {clause.name}
                        </div>
                        <div className="font-mono text-xs text-gray-900 break-all whitespace-pre-wrap mb-1">
                          {clause.content}
                        </div>
                        <p className="text-xs text-gray-500">{clause.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
