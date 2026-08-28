// Database Index Advisor — pure TypeScript, no browser APIs

export interface IndexSuggestion {
  table: string;
  columns: string[];
  reason: string;
  indexType: 'single' | 'composite';
  clause: string;
  createStatement: string;
  complexity: string;
}

export interface IndexAnalysis {
  suggestions: IndexSuggestion[];
  warnings: string[];
  summary: string;
}

export type CardinalityLevel = 'high' | 'medium' | 'low';

export interface CardinalityGuess {
  level: CardinalityLevel;
  reason: string;
}

/**
 * A guess from the column name alone — the query text says nothing about the data.
 * It is the difference between an index worth building and one the planner will ignore,
 * so it is worth showing even as a heuristic.
 */
export function estimateCardinality(column: string): CardinalityGuess {
  const c = column.toLowerCase();

  if (c === 'id' || /(^|_)(uuid|guid)$/.test(c) || /_id$/.test(c)) {
    return { level: 'high', reason: 'Identifier — close to one distinct value per row' };
  }
  if (/(email|username|slug|token|hash|sku|isbn|phone|serial|reference)/.test(c)) {
    return { level: 'high', reason: 'Near-unique business key' };
  }
  if (/(_at$|^date|_date$|time|timestamp|created|updated|deleted_at)/.test(c)) {
    return { level: 'high', reason: 'Timestamp — many distinct values, and ranges scan well' };
  }
  if (/^(is_|has_|can_|should_)/.test(c) || /(flag|active|enabled|deleted|visible|public)$/.test(c)) {
    return { level: 'low', reason: 'Boolean — two values, so an index rarely pays off on its own' };
  }
  if (/(status|state|type|kind|role|gender|category|level|priority|tier|currency|locale|country)/.test(c)) {
    return { level: 'low', reason: 'Enum-like — few distinct values; useful only as part of a composite' };
  }
  if (/(name|title|description|address|city|comment|body|content)/.test(c)) {
    return { level: 'medium', reason: 'Free text — distinctness depends on the data' };
  }
  if (/(price|total|amount|count|quantity|score|rating|age|size)/.test(c)) {
    return { level: 'medium', reason: 'Numeric measure — spread depends on the data' };
  }
  return { level: 'medium', reason: 'Unknown — check the real distinct count before committing' };
}

/** The recommendations as a script you can paste into a migration, duplicates removed. */
export function buildIndexScript(analysis: IndexAnalysis): string {
  return Array.from(new Set(analysis.suggestions.map(s => s.createStatement))).join('\n');
}

function cleanIdentifier(s: string): string {
  return s.replace(/[`"[\]\s]/g, '').split('.').pop() || s;
}

function extractTableAliases(sql: string): Map<string, string> {
  const map = new Map<string, string>();
  // FROM table [AS] alias
  const fromRe = /\bFROM\s+([\w`"[\].]+)\s+(?:AS\s+)?([\w]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = fromRe.exec(sql)) !== null) {
    const tbl = cleanIdentifier(m[1]);
    const alias = m[2].toUpperCase();
    if (!['WHERE', 'JOIN', 'ON', 'GROUP', 'ORDER', 'HAVING', 'LIMIT'].includes(alias)) {
      map.set(m[2], tbl);
    }
  }
  // JOIN table [AS] alias
  const joinRe = /\bJOIN\s+([\w`"[\].]+)\s+(?:AS\s+)?([\w]+)/gi;
  while ((m = joinRe.exec(sql)) !== null) {
    const tbl = cleanIdentifier(m[1]);
    const alias = m[2].toUpperCase();
    if (!['ON', 'WHERE', 'GROUP', 'ORDER'].includes(alias)) {
      map.set(m[2], tbl);
    }
  }
  return map;
}

function resolveTable(ref: string, aliases: Map<string, string>, defaultTable: string): string {
  if (ref.includes('.')) {
    const [prefix, col] = ref.split('.');
    return aliases.get(prefix) || prefix;
  }
  return defaultTable;
}

function resolveColumn(ref: string): string {
  if (ref.includes('.')) return ref.split('.').pop() || ref;
  return ref;
}

function extractMainTable(sql: string): string {
  const m = sql.match(/\bFROM\s+([\w`"[\].]+)/i);
  return m ? cleanIdentifier(m[1]) : 'unknown_table';
}

function extractWhereCols(sql: string, mainTable: string, aliases: Map<string, string>): { table: string; col: string }[] {
  const result: { table: string; col: string }[] = [];
  const whereMatch = sql.match(/\bWHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+HAVING|\s+LIMIT|$)/si);
  if (!whereMatch) return result;

  const whereClause = whereMatch[1];
  // Find column references: table.col = val or col = val or col IN (...) or col LIKE ...
  const condRe = /([\w.]+)\s*(?:=|!=|<>|<=|>=|<|>|IN|LIKE|BETWEEN|IS)/gi;
  let m: RegExpExecArray | null;
  while ((m = condRe.exec(whereClause)) !== null) {
    const ref = m[1].trim();
    if (/^['"\d]/.test(ref)) continue; // skip literals
    const table = resolveTable(ref, aliases, mainTable);
    const col = resolveColumn(ref);
    if (col && !result.some(r => r.table === table && r.col === col)) {
      result.push({ table, col });
    }
  }
  return result;
}

function extractJoinCols(sql: string, aliases: Map<string, string>): { table: string; col: string; reason: string }[] {
  const result: { table: string; col: string; reason: string }[] = [];
  const onRe = /\bON\s+([\w.]+)\s*=\s*([\w.]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = onRe.exec(sql)) !== null) {
    for (const ref of [m[1], m[2]]) {
      if (ref.includes('.')) {
        const [prefix] = ref.split('.');
        const table = aliases.get(prefix) || prefix;
        const col = resolveColumn(ref);
        if (!result.some(r => r.table === table && r.col === col)) {
          result.push({ table, col, reason: 'JOIN ON condition' });
        }
      }
    }
  }
  return result;
}

function extractOrderByCols(sql: string, mainTable: string, aliases: Map<string, string>): { table: string; col: string }[] {
  const result: { table: string; col: string }[] = [];
  const obMatch = sql.match(/\bORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/si);
  if (!obMatch) return result;
  const cols = obMatch[1].split(',');
  for (const c of cols) {
    const ref = c.trim().replace(/\s+(ASC|DESC)\s*$/i, '').trim();
    if (!ref) continue;
    const table = resolveTable(ref, aliases, mainTable);
    const col = resolveColumn(ref);
    if (col && !result.some(r => r.table === table && r.col === col)) {
      result.push({ table, col });
    }
  }
  return result;
}

function extractGroupByCols(sql: string, mainTable: string, aliases: Map<string, string>): { table: string; col: string }[] {
  const result: { table: string; col: string }[] = [];
  const gbMatch = sql.match(/\bGROUP\s+BY\s+(.+?)(?:\s+HAVING|\s+ORDER|\s+LIMIT|$)/si);
  if (!gbMatch) return result;
  const cols = gbMatch[1].split(',');
  for (const c of cols) {
    const ref = c.trim();
    if (!ref) continue;
    const table = resolveTable(ref, aliases, mainTable);
    const col = resolveColumn(ref);
    if (col && !result.some(r => r.table === table && r.col === col)) {
      result.push({ table, col });
    }
  }
  return result;
}

function makeIndexName(table: string, cols: string[]): string {
  return `idx_${table}_${cols.join('_')}`;
}

export function analyzeQuery(sql: string): IndexAnalysis {
  if (!sql.trim()) {
    return { suggestions: [], warnings: [], summary: '' };
  }

  const upper = sql.toUpperCase().trim();
  if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
    return {
      suggestions: [],
      warnings: ['Only SELECT queries are analyzed for index recommendations.'],
      summary: 'Non-SELECT query — no index recommendations generated.',
    };
  }

  const mainTable = extractMainTable(sql);
  const aliases = extractTableAliases(sql);
  const suggestions: IndexSuggestion[] = [];
  const warnings: string[] = [];

  // WHERE columns
  const whereCols = extractWhereCols(sql, mainTable, aliases);
  for (const { table, col } of whereCols) {
    if (col === '*') continue;
    suggestions.push({
      table,
      columns: [col],
      reason: 'Column used in WHERE clause — indexes speed up row filtering',
      indexType: 'single',
      clause: 'WHERE',
      createStatement: `CREATE INDEX ${makeIndexName(table, [col])} ON ${table} (${col});`,
      complexity: 'O(log n) lookup vs O(n) full scan',
    });
  }

  // JOIN ON columns
  const joinCols = extractJoinCols(sql, aliases);
  for (const { table, col, reason } of joinCols) {
    if (!suggestions.some(s => s.table === table && s.columns[0] === col)) {
      suggestions.push({
        table,
        columns: [col],
        reason: `${reason} — indexes on join keys eliminate nested-loop scans`,
        indexType: 'single',
        clause: 'JOIN ON',
        createStatement: `CREATE INDEX ${makeIndexName(table, [col])} ON ${table} (${col});`,
        complexity: 'O(log n) vs O(n*m) without index',
      });
    }
  }

  // ORDER BY columns
  const orderCols = extractOrderByCols(sql, mainTable, aliases);
  for (const { table, col } of orderCols) {
    if (!suggestions.some(s => s.table === table && s.columns[0] === col)) {
      suggestions.push({
        table,
        columns: [col],
        reason: 'Column used in ORDER BY — index eliminates filesort',
        indexType: 'single',
        clause: 'ORDER BY',
        createStatement: `CREATE INDEX ${makeIndexName(table, [col])} ON ${table} (${col});`,
        complexity: 'O(1) sort vs O(n log n) filesort',
      });
    }
  }

  // GROUP BY columns
  const groupCols = extractGroupByCols(sql, mainTable, aliases);
  for (const { table, col } of groupCols) {
    if (!suggestions.some(s => s.table === table && s.columns[0] === col)) {
      suggestions.push({
        table,
        columns: [col],
        reason: 'Column used in GROUP BY — index speeds up grouping',
        indexType: 'single',
        clause: 'GROUP BY',
        createStatement: `CREATE INDEX ${makeIndexName(table, [col])} ON ${table} (${col});`,
        complexity: 'O(log n) grouping vs O(n log n) hash/sort',
      });
    }
  }

  // Composite index suggestion when WHERE has multiple columns on same table
  const tableColMap = new Map<string, string[]>();
  for (const { table, col } of whereCols) {
    if (!tableColMap.has(table)) tableColMap.set(table, []);
    tableColMap.get(table)!.push(col);
  }
  for (const [table, cols] of tableColMap.entries()) {
    if (cols.length >= 2) {
      const composite = cols.slice(0, 3);
      suggestions.push({
        table,
        columns: composite,
        reason: `Composite index on (${composite.join(', ')}) — more selective than separate single-column indexes; put highest-cardinality columns first`,
        indexType: 'composite',
        clause: 'WHERE (composite)',
        createStatement: `CREATE INDEX ${makeIndexName(table, composite)} ON ${table} (${composite.join(', ')});`,
        complexity: 'O(log n) for multi-column filter',
      });
    }
  }

  // Warnings
  if (/SELECT\s+\*/i.test(sql)) {
    warnings.push('SELECT * returns all columns — consider selecting only needed columns to reduce I/O.');
  }
  if (/LIKE\s+'%/i.test(sql)) {
    warnings.push('Leading wildcard LIKE \'%...\' cannot use a B-tree index — consider a full-text index or prefix search.');
  }
  if (suggestions.length === 0) {
    warnings.push('No index-able columns detected. Make sure the query includes WHERE, JOIN ON, ORDER BY, or GROUP BY clauses.');
  }

  const summary = suggestions.length > 0
    ? `Found ${suggestions.length} index recommendation${suggestions.length > 1 ? 's' : ''} across ${[...new Set(suggestions.map(s => s.table))].length} table${[...new Set(suggestions.map(s => s.table))].length > 1 ? 's' : ''}.`
    : 'No index recommendations for this query.';

  return { suggestions, warnings, summary };
}
