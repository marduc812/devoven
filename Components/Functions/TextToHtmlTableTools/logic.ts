export type Delimiter = 'tab' | 'comma' | 'pipe' | 'semicolon' | 'auto';

function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  const counts = { '\t': 0, ',': 0, '|': 0, ';': 0 };
  for (const ch of firstLine) {
    if (ch in counts) counts[ch as keyof typeof counts]++;
  }
  const max = Math.max(...Object.values(counts));
  if (max === 0) return ',';
  return Object.entries(counts).find(([, v]) => v === max)![0];
}

function splitLine(line: string, delim: string): string[] {
  return line.split(delim).map(cell => cell.trim());
}

export function textToHtmlTable(text: string, delimiter: Delimiter = 'auto', hasHeader = true): string {
  const delim = delimiter === 'auto' ? detectDelimiter(text) :
    { tab: '\t', comma: ',', pipe: '|', semicolon: ';' }[delimiter];

  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length === 0) throw new Error('Empty input');

  const rows = lines.map(l => splitLine(l, delim));
  const escape = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const htmlLines: string[] = ['<table border="1" cellpadding="4" cellspacing="0">'];
  let startRow = 0;

  if (hasHeader && rows.length > 0) {
    htmlLines.push('  <thead>');
    htmlLines.push('    <tr>');
    for (const cell of rows[0]) htmlLines.push(`      <th>${escape(cell)}</th>`);
    htmlLines.push('    </tr>');
    htmlLines.push('  </thead>');
    startRow = 1;
  }

  if (rows.length > startRow) {
    htmlLines.push('  <tbody>');
    for (const row of rows.slice(startRow)) {
      htmlLines.push('    <tr>');
      for (const cell of row) htmlLines.push(`      <td>${escape(cell)}</td>`);
      htmlLines.push('    </tr>');
    }
    htmlLines.push('  </tbody>');
  }

  htmlLines.push('</table>');
  return htmlLines.join('\n');
}
