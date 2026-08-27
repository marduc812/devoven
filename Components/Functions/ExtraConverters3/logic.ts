// ─── A1. JSON to SQL ─────────────────────────────────────────────────────────

export function jsonToSqlInsert(input: string, tableName: string = 'table_name'): string {
  if (!input.trim()) return '';
  const data = JSON.parse(input);
  if (!Array.isArray(data)) throw new Error('Input must be a JSON array');
  if (data.length === 0) return '-- Empty array, no INSERT statements generated';

  const columns = Object.keys(data[0]);
  const colList = columns.map(c => `\`${c}\``).join(', ');

  const rows = data.map(row => {
    const values = columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'number') return val.toString();
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    return `(${values.join(', ')})`;
  });

  return `INSERT INTO \`${tableName}\` (${colList})\nVALUES\n  ${rows.join(',\n  ')};`;
}

export function jsonToSqlCreateTable(input: string, tableName: string = 'table_name'): string {
  if (!input.trim()) return '';
  const data = JSON.parse(input);
  const sample = Array.isArray(data) ? data[0] : data;
  if (!sample || typeof sample !== 'object') throw new Error('Input must be a JSON object or array of objects');

  const cols = Object.entries(sample).map(([key, val]) => {
    let type = 'TEXT';
    if (typeof val === 'number') type = Number.isInteger(val) ? 'INT' : 'DECIMAL(10,2)';
    else if (typeof val === 'boolean') type = 'TINYINT(1)';
    return `  \`${key}\` ${type}`;
  });

  return `CREATE TABLE \`${tableName}\` (\n  \`id\` INT AUTO_INCREMENT PRIMARY KEY,\n${cols.join(',\n')}\n);`;
}

// ─── A2. Markdown Table ───────────────────────────────────────────────────────

export function arrayToMarkdownTable(headers: string[], rows: string[][]): string {
  if (headers.length === 0) return '';
  const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] ?? '').length), 3));
  const pad = (s: string, w: number) => s.padEnd(w);
  const header = '| ' + headers.map((h, i) => pad(h, colWidths[i])).join(' | ') + ' |';
  const sep = '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |';
  const body = rows.map(row => '| ' + headers.map((_, i) => pad(row[i] ?? '', colWidths[i])).join(' | ') + ' |');
  return [header, sep, ...body].join('\n');
}

export function markdownTableToArray(input: string): { headers: string[]; rows: string[][] } {
  const lines = input.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('Need at least header and separator rows');
  const parse = (line: string) => line.split('|').slice(1, -1).map(c => c.trim());
  const headers = parse(lines[0]);
  const rows = lines.slice(2).map(parse);
  return { headers, rows };
}
