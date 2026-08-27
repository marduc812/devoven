// Pure TypeScript — no browser APIs.

/** Parse a single CSV row respecting quoted fields */
export function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < row.length) {
    if (row[i] === '"') {
      let field = '';
      i++; // skip opening quote
      while (i < row.length) {
        if (row[i] === '"' && row[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (row[i] === '"') {
          i++;
          break;
        } else {
          field += row[i];
          i++;
        }
      }
      fields.push(field);
      if (i < row.length && row[i] === ',') i++;
    } else {
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

function isNumeric(value: string): boolean {
  if (!value.trim()) return false;
  return !isNaN(Number(value.trim()));
}

function isDateLike(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  // ISO date patterns
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(s)) return true;
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) return true;
  return false;
}

type ColumnType = 'number' | 'date' | 'string';

export type ColumnStats = {
  name: string;
  type: ColumnType;
  count: number;         // non-empty values
  nullCount: number;     // empty values
  uniqueCount: number;
  sampleValues: string[];
  // numeric only
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
};

export type CsvAnalysis = {
  rowCount: number;
  columnCount: number;
  columns: ColumnStats[];
};

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function analyzeCsv(csv: string): CsvAnalysis {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 1) throw new Error('Empty CSV');

  const headers = parseCsvRow(lines[0]);
  const colCount = headers.length;
  const dataLines = lines.slice(1).filter(l => l.trim().length > 0);
  const rowCount = dataLines.length;

  // Collect column values
  const colValues: string[][] = headers.map(() => []);

  for (const line of dataLines) {
    const row = parseCsvRow(line);
    for (let j = 0; j < colCount; j++) {
      colValues[j].push(row[j] !== undefined ? row[j] : '');
    }
  }

  const columns: ColumnStats[] = headers.map((name, j) => {
    const values = colValues[j];
    const nullCount = values.filter(v => v.trim() === '').length;
    const nonEmpty = values.filter(v => v.trim() !== '');
    const uniqueValues = Array.from(new Set(values));
    const sampleValues = Array.from(new Set(nonEmpty)).slice(0, 5);

    // Determine type
    const numericCount = nonEmpty.filter(v => isNumeric(v)).length;
    const dateCount = nonEmpty.filter(v => isDateLike(v)).length;

    let type: ColumnType = 'string';
    if (nonEmpty.length > 0 && numericCount === nonEmpty.length) type = 'number';
    else if (nonEmpty.length > 0 && dateCount >= nonEmpty.length * 0.8) type = 'date';

    const stats: ColumnStats = {
      name,
      type,
      count: nonEmpty.length,
      nullCount,
      uniqueCount: uniqueValues.length,
      sampleValues,
    };

    if (type === 'number' && nonEmpty.length > 0) {
      const nums = nonEmpty.map(v => Number(v.trim())).sort((a, b) => a - b);
      stats.min = nums[0];
      stats.max = nums[nums.length - 1];
      stats.mean = nums.reduce((s, n) => s + n, 0) / nums.length;
      stats.median = median(nums);
    }

    return stats;
  });

  return { rowCount, columnCount: colCount, columns };
}
