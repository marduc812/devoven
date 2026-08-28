'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateInserts, SqlDialect } from './logic';

const EXAMPLE = JSON.stringify(
  [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 30, active: true, bio: null },
    { id: 2, name: "Bob O'Brien", email: 'bob@example.com', age: 25, active: false, bio: 'Developer' },
    { id: 3, name: 'Carol', email: 'carol@example.com', age: 35, active: true, bio: null },
  ],
  null,
  2
);

export function JsonToSql() {
  const [fromValue, setFromValue] = useState(EXAMPLE);
  const [toValue, setToValue] = useState('');
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');
  const [tableName, setTableName] = useState('users');
  const [batchSize, setBatchSize] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setFromValue(decodeURIComponent(from));
    const t = params.get('table');
    if (t) setTableName(t);
  }, []);

  useEffect(() => {
    setToValue(generateInserts(fromValue, { tableName, dialect, batchSize }));
  }, [fromValue, tableName, dialect, batchSize]);

  const selectClass =
    'bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30';
  const inputClass =
    'bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30 w-32';

  const extraElements = (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Dialect:</span>
        <select
          className={selectClass}
          value={dialect}
          onChange={e => setDialect(e.target.value as SqlDialect)}
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Table:</span>
        <input
          className={inputClass}
          value={tableName}
          onChange={e => setTableName(e.target.value)}
          placeholder="table_name"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">Batch size:</span>
        <select
          className={selectClass}
          value={batchSize}
          onChange={e => setBatchSize(parseInt(e.target.value, 10))}
        >
          <option value={1}>1 (single inserts)</option>
          <option value={10}>10 rows per INSERT</option>
          <option value={50}>50 rows per INSERT</option>
          <option value={100}>100 rows per INSERT</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="JSON to SQL INSERT"
      description="Convert a [1 JSON array of objects 2] to [1 INSERT INTO 2] SQL statements. Handles [1 NULL 2] values, string escaping (single quotes), and batch inserts. Supports PostgreSQL, MySQL, and SQLite dialects."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Array"
      toTitle="SQL INSERT Statements"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
