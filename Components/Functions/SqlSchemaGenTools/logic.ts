// SQL Schema Generator — pure TypeScript, no browser APIs

export type SqlDialect = 'postgresql' | 'mysql' | 'sqlite';

export interface ColumnDef {
  name: string;
  sqlType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  length?: number;
}

export interface TableSchema {
  tableName: string;
  columns: ColumnDef[];
}

function inferType(value: unknown, dialect: SqlDialect): string {
  if (value === null || value === undefined) return dialect === 'sqlite' ? 'TEXT' : 'VARCHAR(255)';

  if (typeof value === 'boolean') {
    if (dialect === 'sqlite') return 'INTEGER';
    if (dialect === 'mysql') return 'TINYINT(1)';
    return 'BOOLEAN';
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      if (value > 2147483647 || value < -2147483648) return 'BIGINT';
      return 'INTEGER';
    }
    return dialect === 'sqlite' ? 'REAL' : 'FLOAT';
  }

  if (typeof value === 'string') {
    // Detect timestamps / ISO dates
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return dialect === 'sqlite' ? 'TEXT' : 'TIMESTAMP';
    }
    // Detect plain dates
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return dialect === 'sqlite' ? 'TEXT' : 'DATE';
    }
    const len = value.length;
    if (len > 255) return 'TEXT';
    if (dialect === 'sqlite') return 'TEXT';
    if (len <= 50) return `VARCHAR(${Math.max(50, Math.ceil(len / 10) * 10 + 10)})`;
    return 'VARCHAR(255)';
  }

  if (typeof value === 'object') {
    if (dialect === 'postgresql') return 'JSON';
    if (dialect === 'mysql') return 'JSON';
    return 'TEXT';
  }

  return dialect === 'sqlite' ? 'TEXT' : 'VARCHAR(255)';
}

function isPrimaryKey(name: string): boolean {
  const lower = name.toLowerCase();
  return lower === 'id' || lower === '_id' || lower.endsWith('_id') && lower === 'id';
}

function isLikelyPK(name: string, value: unknown): boolean {
  const lower = name.toLowerCase();
  if (lower === 'id' || lower === '_id') return true;
  if (lower === 'pk' || lower === 'primarykey') return true;
  if (typeof value === 'number' && Number.isInteger(value) && lower === 'id') return true;
  return false;
}

export function inferSchema(input: string, tableName: string, dialect: SqlDialect): TableSchema {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch {
    throw new Error('Invalid JSON input');
  }

  let sample: Record<string, unknown>;
  if (Array.isArray(data)) {
    if (data.length === 0) throw new Error('Empty array — cannot infer schema');
    sample = data[0] as Record<string, unknown>;
  } else if (typeof data === 'object' && data !== null) {
    sample = data as Record<string, unknown>;
  } else {
    throw new Error('Input must be a JSON object or array of objects');
  }

  const columns: ColumnDef[] = [];
  for (const [key, val] of Object.entries(sample)) {
    const isPK = isLikelyPK(key, val);
    const sqlType = inferType(val, dialect);
    const nullable = val === null || val === undefined;
    columns.push({
      name: key,
      sqlType,
      nullable: isPK ? false : nullable,
      isPrimaryKey: isPK,
      length: sqlType.startsWith('VARCHAR') ? parseInt(sqlType.match(/\d+/)?.[0] || '255') : undefined,
    });
  }

  return { tableName: tableName || 'my_table', columns };
}

export function generateCreateTable(schema: TableSchema, dialect: SqlDialect): string {
  const lines: string[] = [];
  const qt = dialect === 'mysql' ? '`' : '"';
  const q = (name: string) => `${qt}${name}${qt}`;

  lines.push(`CREATE TABLE ${q(schema.tableName)} (`);

  const colLines: string[] = [];
  const pkCols = schema.columns.filter(c => c.isPrimaryKey);

  for (const col of schema.columns) {
    let line = `  ${q(col.name)} ${col.sqlType}`;

    if (col.isPrimaryKey) {
      if (dialect === 'postgresql') {
        line = `  ${q(col.name)} SERIAL`;
      } else if (dialect === 'mysql') {
        line = `  ${q(col.name)} INT AUTO_INCREMENT`;
      } else {
        line = `  ${q(col.name)} INTEGER`;
      }
      line += ' NOT NULL';
    } else {
      line += col.nullable ? '' : ' NOT NULL';
    }

    colLines.push(line);
  }

  // Add PRIMARY KEY constraint
  if (pkCols.length > 0) {
    colLines.push(`  PRIMARY KEY (${pkCols.map(c => q(c.name)).join(', ')})`);
  }

  lines.push(colLines.join(',\n'));
  lines.push(');');

  return lines.join('\n');
}

export function generateSqlSchema(input: string, tableName: string, dialect: SqlDialect): string {
  if (!input.trim()) return '';
  try {
    const schema = inferSchema(input, tableName || 'my_table', dialect);
    return generateCreateTable(schema, dialect);
  } catch (e) {
    return `-- Error: ${(e as Error).message}`;
  }
}
