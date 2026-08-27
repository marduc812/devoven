export function jsonToAsciiTable(jsonStr: string): string {
  const data = JSON.parse(jsonStr);

  if (!Array.isArray(data)) throw new Error('Input must be a JSON array of objects');
  if (data.length === 0) return '(empty array)';

  // Gather all unique keys
  const keys = [...new Set(data.flatMap(row => typeof row === 'object' && row !== null ? Object.keys(row as object) : []))];
  if (keys.length === 0) throw new Error('Array items must be objects with keys');

  // Compute column widths
  const widths: Record<string, number> = {};
  for (const key of keys) widths[key] = key.length;
  for (const row of data) {
    for (const key of keys) {
      const val = String((row as Record<string, unknown>)[key] ?? '');
      widths[key] = Math.max(widths[key], Math.min(val.length, 40));
    }
  }

  const cell = (s: string, w: number) => ` ${String(s).substring(0, 40).padEnd(w)} `;
  const hr = keys.map(k => '-'.repeat(widths[k] + 2)).join('+');

  const header = keys.map(k => cell(k, widths[k])).join('|');
  const rows = data.map(row =>
    keys.map(k => cell(String((row as Record<string, unknown>)[k] ?? ''), widths[k])).join('|')
  );

  return ['+' + hr + '+', '|' + header + '|', '+' + hr + '+', ...rows.map(r => '|' + r + '|'), '+' + hr + '+'].join('\n');
}
