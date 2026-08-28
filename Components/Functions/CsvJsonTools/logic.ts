// Pure TypeScript — no browser APIs.

/**
 * Parse a CSV string with a header row into a JSON array of objects.
 * Handles: quoted fields, commas inside quotes, escaped double-quotes ("").
 */
export function csvToJson(csv: string): string {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return '[]';

  const headers = parseCsvRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCsvRow(line);
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j] !== undefined ? values[j] : '';
    }
    rows.push(obj);
  }

  return JSON.stringify(rows, null, 2);
}

/**
 * Parse a single CSV row, handling quoted fields and escaped quotes.
 */
export function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (i < row.length) {
    if (row[i] === '"') {
      // Quoted field
      let field = '';
      i++; // skip opening quote
      while (i < row.length) {
        if (row[i] === '"' && row[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (row[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += row[i];
          i++;
        }
      }
      fields.push(field);
      // skip comma
      if (i < row.length && row[i] === ',') i++;
    } else {
      // Unquoted field
      const end = row.indexOf(',', i);
      if (end === -1) {
        fields.push(row.slice(i));
        break;
      } else {
        fields.push(row.slice(i, end));
        i = end + 1;
      }
    }
  }

  return fields;
}

/**
 * Convert a JSON array of objects to CSV with a header row.
 */
export function jsonToCsv(json: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return 'Error: Invalid JSON';
  }

  if (!Array.isArray(parsed)) return 'Error: Expected a JSON array';
  if (parsed.length === 0) return '';

  const allKeys = new Set<string>();
  for (const item of parsed) {
    if (typeof item === 'object' && item !== null) {
      for (const k of Object.keys(item as Record<string, unknown>)) {
        allKeys.add(k);
      }
    }
  }

  const headers = Array.from(allKeys);
  const csvLines: string[] = [headers.map(escapeCsvField).join(',')];

  for (const item of parsed) {
    if (typeof item !== 'object' || item === null) continue;
    const row = item as Record<string, unknown>;
    const line = headers.map(h => {
      const val = row[h];
      return escapeCsvField(val === null || val === undefined ? '' : String(val));
    }).join(',');
    csvLines.push(line);
  }

  return csvLines.join('\n');
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/**
 * Auto-detect whether input looks like CSV or JSON.
 * Returns 'csv' or 'json'.
 */
export function detectInputType(input: string): 'csv' | 'json' {
  const trimmed = input.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return 'json';
  return 'csv';
}
