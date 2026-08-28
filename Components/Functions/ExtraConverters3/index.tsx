'use client';

import React, { useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  jsonToSqlInsert,
  jsonToSqlCreateTable,
  arrayToMarkdownTable,
  markdownTableToArray,
} from './logic';

// ─── A1. JSON to SQL INSERT ───────────────────────────────────────────────────

export const JsonToSql = () => {
  const [fromValue, setFromValue] = useState('');
  const [mode, setMode] = useState<'insert' | 'create'>('insert');
  const [tableName, setTableName] = useState('table_name');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = mode === 'insert'
        ? jsonToSqlInsert(fromValue, tableName)
        : jsonToSqlCreateTable(fromValue, tableName);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  const extraElements = (
    <div className="flex flex-row flex-wrap items-center gap-3">
      <select
        className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
        value={mode}
        onChange={e => setMode(e.target.value as 'insert' | 'create')}
      >
        <option value="insert">INSERT</option>
        <option value="create">CREATE TABLE</option>
      </select>
      <input
        type="text"
        className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 font-mono"
        placeholder="table_name"
        value={tableName}
        onChange={e => setTableName(e.target.value || 'table_name')}
      />
    </div>
  );

  return (
    <AdvancedConverter
      title="JSON to SQL"
      description={'Convert a [1 JSON array 2] to SQL [1 INSERT 2] statements.'}
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Input"
      toTitle="SQL Output"
      extraElements={extraElements}
      backColor="cyan"
    />
  );
};

// ─── A2. Markdown Table Builder ───────────────────────────────────────────────

const DEFAULT_HEADERS = ['Column 1', 'Column 2', 'Column 3'];
const DEFAULT_ROWS = [['', '', ''], ['', '', '']];

