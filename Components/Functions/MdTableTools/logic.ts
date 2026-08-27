export type MdTableAlignment = 'left' | 'center' | 'right' | 'none';
export type MdTableDirection = 'csv-to-md' | 'md-to-csv' | 'auto';

export function parseDelimitedData(input: string): string[][] {
  const lines = input.trim().split('\n');
  const rows: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    // Detect delimiter: tab or comma
    const tabCount = (line.match(/\t/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;
    const delim = tabCount >= commaCount ? '\t' : ',';

    if (delim === ',') {
      rows.push(parseCsvLine(line));
    } else {
      rows.push(line.split('\t'));
    }
  }
  return rows;
}

export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function buildMarkdownTable(rows: string[][], alignment: MdTableAlignment): string {
  if (rows.length === 0) return '';
  const colCount = Math.max(...rows.map(r => r.length));

  // Normalize row lengths
  const normalized = rows.map(r => {
    const padded = r.slice();
    while (padded.length < colCount) padded.push('');
    return padded;
  });

  // Calculate column widths
  const colWidths: number[] = [];
  for (let c = 0; c < colCount; c++) {
    let maxW = 3; // minimum for alignment marker
    for (const row of normalized) {
      maxW = Math.max(maxW, row[c].length);
    }
    colWidths.push(maxW);
  }

  const pad = (cell: string, width: number, align: MdTableAlignment): string => {
    if (align === 'right') return cell.padStart(width);
    if (align === 'center') {
      const total = width - cell.length;
      const left = Math.floor(total / 2);
      const right = total - left;
      return ' '.repeat(left) + cell + ' '.repeat(right);
    }
    return cell.padEnd(width);
  };

  const alignMarker = (width: number, align: MdTableAlignment): string => {
    switch (align) {
      case 'left': return ':' + '-'.repeat(width - 1);
      case 'right': return '-'.repeat(width - 1) + ':';
      case 'center': return ':' + '-'.repeat(width - 2) + ':';
      case 'none': return '-'.repeat(width);
    }
  };

  const lines: string[] = [];

  // Header row
  const header = normalized[0];
  lines.push('| ' + header.map((cell, c) => pad(cell, colWidths[c], alignment)).join(' | ') + ' |');

  // Separator row
  lines.push('| ' + colWidths.map(w => alignMarker(w, alignment)).join(' | ') + ' |');

  // Data rows
  for (let r = 1; r < normalized.length; r++) {
    lines.push('| ' + normalized[r].map((cell, c) => pad(cell, colWidths[c], alignment)).join(' | ') + ' |');
  }

  return lines.join('\n');
}

export function parseMarkdownTable(input: string): string {
  const lines = input.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('A Markdown table must have at least a header and separator row');

  const parseRow = (line: string): string[] => {
    const trimmed = line.trim();
    const stripped = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
    const cells = stripped.endsWith('|') ? stripped.slice(0, -1) : stripped;
    return cells.split('|').map(c => c.trim());
  };

  const isSeparator = (line: string): boolean => /^\|?[\s\-:|]+\|/.test(line);

  const rows: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    if (i === 1 && isSeparator(lines[i])) continue; // skip separator
    rows.push(parseRow(lines[i]));
  }

  return rows.map(row => row.join(',')).join('\n');
}

export function detectMdTableInput(input: string): MdTableDirection {
  const trimmed = input.trim();
  if (trimmed.startsWith('|') || /^\s*\|/.test(trimmed)) {
    // Likely a markdown table
    const lines = trimmed.split('\n');
    if (lines.length >= 2 && /^\|?[\s\-:|]+\|/.test(lines[1])) {
      return 'md-to-csv';
    }
  }
  return 'csv-to-md';
}

export function processMdTable(
  input: string,
  direction: MdTableDirection,
  alignment: MdTableAlignment
): string {
  if (!input.trim()) return '';
  const effectiveDir = direction === 'auto' ? detectMdTableInput(input) : direction;
  if (effectiveDir === 'md-to-csv') {
    return parseMarkdownTable(input);
  }
  const rows = parseDelimitedData(input);
  if (rows.length === 0) return '';
  return buildMarkdownTable(rows, alignment);
}
