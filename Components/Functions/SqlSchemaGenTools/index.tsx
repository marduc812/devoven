'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateSqlSchema, SqlDialect } from './logic';

const EXAMPLE = JSON.stringify(
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    age: 30,
    is_active: true,
    score: 9.5,
    bio: null,
    created_at: "2024-01-15T10:30:00Z",
  },
  null,
  2
);

export function SqlSchemaGenerator() {
  const [fromValue, setFromValue] = useState(EXAMPLE);
  const [toValue, setToValue] = useState('');
  const [dialect, setDialect] = useState<SqlDialect>('postgresql');
  const [tableName, setTableName] = useState('users');

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
    setToValue(generateSqlSchema(fromValue, tableName, dialect));
  }, [fromValue, tableName, dialect]);

  const selectClass =
    'bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30';
  const inputClass =
    'bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30 w-36';

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
        <span className="text-gray-400 text-sm">Table name:</span>
        <input
          className={inputClass}
          value={tableName}
          onChange={e => setTableName(e.target.value)}
          placeholder="my_table"
        />
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="SQL Schema Generator"
      description="Paste a [1 JSON object or array 2] and generate a [1 CREATE TABLE 2] SQL statement with inferred column types ([1 VARCHAR 2], [1 INT 2], [1 BIGINT 2], [1 FLOAT 2], [1 BOOLEAN 2], [1 TIMESTAMP 2], [1 TEXT 2], [1 JSON 2]). Supports PostgreSQL, MySQL, and SQLite dialects."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Sample Data"
      toTitle="CREATE TABLE SQL"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
