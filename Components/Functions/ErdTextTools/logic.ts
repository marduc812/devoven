// ERD Text Generator — pure TypeScript, no browser APIs

export interface ErdColumn {
  name: string;
  isForeignKey: boolean;
  isPrimaryKey: boolean;
}

export interface ErdTable {
  name: string;
  columns: ErdColumn[];
}

export interface ErdRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

export interface ErdModel {
  tables: ErdTable[];
  relationships: ErdRelationship[];
}

/**
 * Parse simple ERD syntax:
 *   users(id, name, email) orders(id, user_id, total)
 *   Multiple tables separated by whitespace, each: tablename(col1, col2, ...)
 */
export function parseErdInput(input: string): ErdModel {
  const tables: ErdTable[] = [];
  const relationships: ErdRelationship[] = [];

  const tableRe = /(\w+)\s*\(([^)]+)\)/g;
  let m: RegExpExecArray | null;

  while ((m = tableRe.exec(input)) !== null) {
    const tableName = m[1].toLowerCase();
    const rawCols = m[2].split(',').map(c => c.trim()).filter(Boolean);

    const columns: ErdColumn[] = rawCols.map(col => {
      const lower = col.toLowerCase();
      return {
        name: col,
        isPrimaryKey: lower === 'id' || lower === `${tableName}_id`,
        isForeignKey: lower.endsWith('_id') && lower !== 'id' && lower !== `${tableName}_id`,
      };
    });

    tables.push({ name: tableName, columns });
  }

  // Detect relationships from foreign keys
  const tableNames = new Set(tables.map(t => t.name));
  for (const table of tables) {
    for (const col of table.columns) {
      if (col.isForeignKey) {
        // e.g. user_id → users table, order_id → orders table
        const refName = col.name.replace(/_id$/, '');
        const candidates = [refName, refName + 's', refName.replace(/y$/, 'ies')];
        for (const candidate of candidates) {
          if (tableNames.has(candidate)) {
            // Find PK column of referenced table
            const refTable = tables.find(t => t.name === candidate);
            const pkCol = refTable?.columns.find(c => c.isPrimaryKey) || { name: 'id' };
            relationships.push({
              fromTable: table.name,
              fromColumn: col.name,
              toTable: candidate,
              toColumn: pkCol.name,
            });
            break;
          }
        }
      }
    }
  }

  return { tables, relationships };
}

function padRight(s: string, len: number): string {
  return s + ' '.repeat(Math.max(0, len - s.length));
}

function repeatChar(ch: string, n: number): string {
  let result = '';
  for (let i = 0; i < n; i++) result += ch;
  return result;
}

export function generateAsciiErd(model: ErdModel): string {
  if (model.tables.length === 0) return '(no tables detected)';

  const lines: string[] = [];

  for (const table of model.tables) {
    const header = ' ' + table.name.toUpperCase() + ' ';
    const colLines = table.columns.map(col => {
      let label = col.name;
      if (col.isPrimaryKey) label += ' [PK]';
      if (col.isForeignKey) label += ' [FK]';
      return ' ' + label;
    });

    const maxLen = Math.max(header.length, ...colLines.map(l => l.length));
    const width = maxLen + 2;

    lines.push('+' + repeatChar('-', width) + '+');
    lines.push('|' + padRight(header, width) + '|');
    lines.push('+' + repeatChar('-', width) + '+');
    for (const cl of colLines) {
      lines.push('|' + padRight(cl, width) + '|');
    }
    lines.push('+' + repeatChar('-', width) + '+');
    lines.push('');
  }

  if (model.relationships.length > 0) {
    lines.push('Relationships:');
    for (const r of model.relationships) {
      lines.push(`  ${r.fromTable}.${r.fromColumn} ---> ${r.toTable}.${r.toColumn} (many-to-one)`);
    }
  }

  return lines.join('\n');
}

export function generateMermaidErd(model: ErdModel): string {
  if (model.tables.length === 0) return 'erDiagram\n  %% (no tables detected)';

  const lines: string[] = ['erDiagram'];

  for (const table of model.tables) {
    lines.push(`  ${table.name.toUpperCase()} {`);
    for (const col of table.columns) {
      let type = 'string';
      const lower = col.name.toLowerCase();
      if (lower === 'id' || lower.endsWith('_id')) type = 'int';
      if (lower.includes('total') || lower.includes('price') || lower.includes('amount')) type = 'float';
      if (lower.includes('date') || lower.includes('at') || lower.includes('time')) type = 'datetime';
      if (lower.includes('active') || lower.includes('enabled') || lower.includes('is_')) type = 'boolean';
      let key = '';
      if (col.isPrimaryKey) key = ' PK';
      if (col.isForeignKey) key = ' FK';
      lines.push(`    ${type} ${col.name}${key}`);
    }
    lines.push('  }');
    lines.push('');
  }

  for (const r of model.relationships) {
    lines.push(`  ${r.toTable.toUpperCase()} ||--o{ ${r.fromTable.toUpperCase()} : "has"`);
  }

  return lines.join('\n');
}

export function generateErdOutput(input: string): string {
  if (!input.trim()) return '';
  try {
    const model = parseErdInput(input);
    const ascii = generateAsciiErd(model);
    const mermaid = generateMermaidErd(model);

    return [
      '=== ASCII ER DIAGRAM ===',
      '',
      ascii,
      '',
      '=== MERMAID erDiagram ===',
      '',
      mermaid,
    ].join('\n');
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}
