import jsYaml from 'js-yaml';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import * as TOML from 'smol-toml';
import { marked } from 'marked';
import TurndownService from 'turndown';

// All functions in this file are pure (no React, no browser APIs).
// They take strings and return strings, throwing descriptive errors on bad input.

// ─── JSON ↔ YAML ─────────────────────────────────────────────────────────────

export function jsonToYaml(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input);
  return jsYaml.dump(obj);
}

export function yamlToJson(input: string): string {
  if (!input.trim()) return '';
  const obj = jsYaml.load(input);
  if (obj === undefined) throw new Error('Invalid YAML');
  return JSON.stringify(obj, null, 2);
}

// ─── JSON ↔ XML ──────────────────────────────────────────────────────────────

export function jsonToXml(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input);
  const builder = new XMLBuilder({ format: true, indentBy: '  ' });
  const xml = builder.build({ root: obj });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

export function xmlToJson(input: string): string {
  if (!input.trim()) return '';
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const obj = parser.parse(input);
  return JSON.stringify(obj, null, 2);
}

// ─── Internal CSV helpers ─────────────────────────────────────────────────────

function csvEscape(val: unknown): string {
  const str = val == null ? '' : String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function parseCsvRow(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === ',' && !inQuote) {
      cols.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

// ─── JSON ↔ CSV ───────────────────────────────────────────────────────────────

export function jsonToCsv(input: string): string {
  if (!input.trim()) return '';
  const data = JSON.parse(input);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Input must be a non-empty JSON array of objects');
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((row: Record<string, unknown>) =>
    headers.map(h => csvEscape(row[h])).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function csvToJson(input: string): string {
  if (!input.trim()) return '';
  const lines = input.trim().split('\n');
  const headers = parseCsvRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCsvRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
  return JSON.stringify(rows, null, 2);
}

// ─── JSON ↔ TOML ─────────────────────────────────────────────────────────────

export function jsonToToml(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input);
  return TOML.stringify(obj as Record<string, unknown>);
}

export function tomlToJson(input: string): string {
  if (!input.trim()) return '';
  const obj = TOML.parse(input);
  return JSON.stringify(obj, null, 2);
}

// ─── CSV ↔ XML ───────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function csvToXml(input: string): string {
  if (!input.trim()) return '';
  const lines = input.trim().split('\n');
  const headers = parseCsvRow(lines[0]);
  const rows = lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCsvRow(line);
    const fields = headers
      .map((h, i) => `  <${h}>${escapeXml(values[i] ?? '')}</${h}>`)
      .join('\n');
    return `<row>\n${fields}\n</row>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${rows.join('\n')}\n</root>`;
}

export function xmlToCsv(input: string): string {
  if (!input.trim()) return '';
  const parser = new XMLParser();
  const obj = parser.parse(input);
  const rootKey = Object.keys(obj).find(k => k !== '?xml') ?? Object.keys(obj)[0];
  const childKey = Object.keys(obj[rootKey])[0];
  const rawRows = obj[rootKey][childKey];
  const rows: Record<string, unknown>[] = Array.isArray(rawRows) ? rawRows : [rawRows];
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvRows = rows.map(row => headers.map(h => csvEscape(row[h])).join(','));
  return [headers.join(','), ...csvRows].join('\n');
}

// ─── CSV ↔ Markdown Table ────────────────────────────────────────────────────

export function csvToMarkdownTable(input: string): string {
  if (!input.trim()) return '';
  const lines = input.trim().split('\n');
  const headers = parseCsvRow(lines[0]);
  const separator = headers.map(() => '---').join(' | ');
  const rows = lines.slice(1).filter(l => l.trim()).map(line =>
    parseCsvRow(line).map(cell => cell.replace(/\|/g, '\\|')).join(' | ')
  );
  return [
    '| ' + headers.join(' | ') + ' |',
    '| ' + separator + ' |',
    ...rows.map(r => '| ' + r + ' |'),
  ].join('\n');
}

export function markdownTableToCsv(input: string): string {
  if (!input.trim()) return '';
  const lines = input
    .trim()
    .split('\n')
    .filter(l => l.trim() && !/^\|[-| :]+\|$/.test(l.trim()));
  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, '')
      .split('|')
      .map(c => c.trim().replace(/\\\|/g, '|'));
  return lines
    .map(parseRow)
    .map(cells =>
      cells
        .map(c =>
          c.includes(',') || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c
        )
        .join(',')
    )
    .join('\n');
}

// ─── HTML Table helpers (pure — called by React components after DOMParser) ──

export function tableDataToCsv(headers: string[], rows: string[][]): string {
  const header = headers.map(csvEscape).join(',');
  const dataRows = rows.map(row => row.map(csvEscape).join(','));
  return [header, ...dataRows].join('\n');
}

export function tableDataToJson(headers: string[], rows: string[][]): string {
  const data = rows.map(row =>
    Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
  );
  return JSON.stringify(data, null, 2);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function toPascalCase(key: string): string {
  return key
    .replace(/(^|_|-|\.|\ )([a-z])/g, (_: string, __: string, c: string) => c.toUpperCase())
    .replace(/^[a-z]/, (c: string) => c.toUpperCase());
}

function toSnakeCase(key: string): string {
  return key
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

// ─── JSON → TypeScript Interface ─────────────────────────────────────────────

function tsTypeOf(val: unknown, depth: number): string {
  if (val === null) return 'null';
  if (Array.isArray(val)) {
    const inner = val.length > 0 ? tsTypeOf(val[0], depth) : 'unknown';
    return `${inner}[]`;
  }
  if (typeof val === 'object') {
    const indent = '  '.repeat(depth + 1);
    const fields = Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${indent}${k}: ${tsTypeOf(v, depth + 1)};`)
      .join('\n');
    return `{\n${fields}\n${'  '.repeat(depth)}}`;
  }
  return typeof val;
}

export function jsonToTypeScriptInterface(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input) as Record<string, unknown>;
  const fields = Object.entries(obj)
    .map(([k, v]) => `  ${k}: ${tsTypeOf(v, 1)};`)
    .join('\n');
  return `export interface Root {\n${fields}\n}`;
}

// ─── JSON → Go Struct ─────────────────────────────────────────────────────────

function goTypeOf(val: unknown): string {
  if (val === null) return 'interface{}';
  if (Array.isArray(val)) return `[]${val.length > 0 ? goTypeOf(val[0]) : 'interface{}'}`;
  switch (typeof val) {
    case 'string': return 'string';
    case 'number': return Number.isInteger(val) ? 'int' : 'float64';
    case 'boolean': return 'bool';
    case 'object': return 'interface{}';
  }
  return 'interface{}';
}

export function jsonToGoStruct(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input) as Record<string, unknown>;
  const fields = Object.entries(obj)
    .map(([k, v]) => `\t${toPascalCase(k)} ${goTypeOf(v)} \`json:"${k}"\``)
    .join('\n');
  return `package main\n\ntype Root struct {\n${fields}\n}`;
}

// ─── JSON → Rust Struct ───────────────────────────────────────────────────────

function rustTypeOf(val: unknown): string {
  if (val === null) return 'Option<serde_json::Value>';
  if (Array.isArray(val)) return `Vec<${val.length > 0 ? rustTypeOf(val[0]) : 'serde_json::Value'}>`;
  switch (typeof val) {
    case 'string': return 'String';
    case 'number': return Number.isInteger(val) ? 'i64' : 'f64';
    case 'boolean': return 'bool';
    case 'object': return 'serde_json::Value';
  }
  return 'serde_json::Value';
}

export function jsonToRustStruct(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input) as Record<string, unknown>;
  const fields = Object.entries(obj)
    .map(([k, v]) => `    pub ${toSnakeCase(k)}: ${rustTypeOf(v)},`)
    .join('\n');
  return `#[derive(Debug, Serialize, Deserialize)]\npub struct Root {\n${fields}\n}`;
}

// ─── JSON → Zod Schema ───────────────────────────────────────────────────────

function zodTypeOf(val: unknown, depth: number): string {
  if (val === null) return 'z.null()';
  if (Array.isArray(val)) {
    const inner = val.length > 0 ? zodTypeOf(val[0], depth) : 'z.unknown()';
    return `z.array(${inner})`;
  }
  if (typeof val === 'object') {
    const indent = '  '.repeat(depth + 1);
    const fields = Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${indent}  ${k}: ${zodTypeOf(v, depth + 1)},`)
      .join('\n');
    return `z.object({\n${fields}\n${indent}})`;
  }
  switch (typeof val) {
    case 'string': return 'z.string()';
    case 'number': return 'z.number()';
    case 'boolean': return 'z.boolean()';
  }
  return 'z.unknown()';
}

export function jsonToZodSchema(input: string): string {
  if (!input.trim()) return '';
  const obj = JSON.parse(input) as Record<string, unknown>;
  const fields = Object.entries(obj)
    .map(([k, v]) => `  ${k}: ${zodTypeOf(v, 0)},`)
    .join('\n');
  return `import { z } from 'zod';\n\nexport const rootSchema = z.object({\n${fields}\n});\n\nexport type Root = z.infer<typeof rootSchema>;`;
}

// ─── Markdown ↔ HTML ─────────────────────────────────────────────────────────

export function markdownToHtml(input: string): string {
  if (!input.trim()) return '';
  return marked(input) as string;
}

export function htmlToMarkdown(input: string): string {
  if (!input.trim()) return '';
  const td = new TurndownService({ headingStyle: 'atx' });
  return td.turndown(input);
}
