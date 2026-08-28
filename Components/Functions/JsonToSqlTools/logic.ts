// JSON to SQL INSERT Generator — pure TypeScript, no browser APIs

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

function escapeString(val: string, dialect: SqlDialect): string {
  // Escape single quotes by doubling them (ANSI SQL)
  const escaped = val.replace(/'/g, "''");
  return `'${escaped}'`;
}

function formatValue(val: unknown, dialect: SqlDialect): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') {
    if (dialect === 'sqlite') return val ? '1' : '0';
    if (dialect === 'mysql') return val ? 'TRUE' : 'FALSE';
    return val ? 'TRUE' : 'FALSE';
  }
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return escapeString(val, dialect);
  // Objects / arrays → JSON string
  return escapeString(JSON.stringify(val), dialect);
}

function quoteIdentifier(name: string, dialect: SqlDialect): string {
  if (dialect === 'mysql') return `\`${name}\``;
  return `"${name}"`;
}

export interface InsertOptions {
  tableName: string;
  dialect: SqlDialect;
  batchSize: number;
}

export function generateInserts(input: string, options: InsertOptions): string {
  if (!input.trim()) return '';

  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    return '-- Error: Invalid JSON input';
  }

  const rows: Record<string, unknown>[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        rows.push(item as Record<string, unknown>);
      }
    }
    if (rows.length === 0) return '-- Error: Array contains no objects';
  } else if (typeof data === 'object' && data !== null) {
    rows.push(data as Record<string, unknown>);
  } else {
    return '-- Error: Input must be a JSON object or array of objects';
  }

  if (rows.length === 0) return '-- Error: No rows to insert';

  const { tableName, dialect, batchSize } = options;
  const q = (name: string) => quoteIdentifier(name, dialect);

  // Collect all column names (union of all rows)
  const colSet = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) colSet.add(key);
  }
  const columns = Array.from(colSet);
  const colList = columns.map(c => q(c)).join(', ');
  const table = q(tableName);

  const lines: string[] = [];
  lines.push(`-- Generated INSERT statements for ${table}`);
  lines.push(`-- Dialect: ${dialect.toUpperCase()}, Rows: ${rows.length}`);
  lines.push('');

  const effectiveBatch = batchSize > 0 ? batchSize : 1;

  for (let i = 0; i < rows.length; i += effectiveBatch) {
    const batch = rows.slice(i, i + effectiveBatch);
    if (effectiveBatch === 1 || batch.length === 1) {
      for (const row of batch) {
        const vals = columns.map(c => formatValue(row[c], dialect)).join(', ');
        lines.push(`INSERT INTO ${table} (${colList}) VALUES (${vals});`);
      }
    } else {
      // Multi-row INSERT
      const valueRows = batch.map(row => {
        const vals = columns.map(c => formatValue(row[c], dialect)).join(', ');
        return `  (${vals})`;
      });
      lines.push(`INSERT INTO ${table} (${colList}) VALUES`);
      lines.push(valueRows.join(',\n') + ';');
    }
    if (i + effectiveBatch < rows.length) lines.push('');
  }

  return lines.join('\n');
}
