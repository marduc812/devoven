import type { CsvOptions } from './types';

export const DEFAULT_CSV_OPTIONS: CsvOptions = { separator: ',', quotedFields: true };

/** Parse one CSV record with optional quoted fields and doubled quote escapes. */
export function parseCsvRecord(record: string, options: CsvOptions = DEFAULT_CSV_OPTIONS): string[] {
  const cells: string[] = [];
  let value = '';
  let quoted = false;

  for (let i = 0; i < record.length; i++) {
    const char = record[i];
    if (options.quotedFields && char === '"') {
      if (quoted && record[i + 1] === '"') {
        value += '"';
        i++;
      } else if (quoted || value === '') {
        quoted = !quoted;
      } else {
        value += char;
      }
    } else if (char === options.separator && !quoted) {
      cells.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  cells.push(value);
  return cells;
}
