// Components/Functions/DataTypeAnalyzerTools/logic.ts
// Pure logic — no browser APIs.

export type InferredType = 'integer' | 'float' | 'boolean' | 'date' | 'email' | 'url' | 'categorical' | 'free text' | 'empty';

export interface ColumnStats {
  name: string;
  inferredType: InferredType;
  totalCount: number;
  nullCount: number;
  uniqueCount: number;
  sampleValues: string[];
  minValue?: number;
  maxValue?: number;
  minStr?: string;
  maxStr?: string;
}

// Regex patterns (no browser APIs, pure JS)
const RE_INTEGER = /^-?\d+$/;
const RE_FLOAT = /^-?\d+\.\d+([eE][+-]?\d+)?$|^-?\d+[eE][+-]?\d+$/;
const RE_BOOLEAN = /^(true|false|yes|no|1|0|t|f|y|n)$/i;
const RE_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$|^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_URL = /^https?:\/\/[^\s]+$/i;

function isNull(val: string): boolean {
  const v = val.trim().toLowerCase();
  return v === '' || v === 'null' || v === 'na' || v === 'n/a' || v === 'none' || v === '-';
}

function inferCellType(val: string): InferredType | 'unknown' {
  if (isNull(val)) return 'empty';
  const v = val.trim();
  if (RE_INTEGER.test(v)) return 'integer';
  if (RE_FLOAT.test(v)) return 'float';
  if (RE_BOOLEAN.test(v)) return 'boolean';
  if (RE_DATE.test(v)) return 'date';
  if (RE_EMAIL.test(v)) return 'email';
  if (RE_URL.test(v)) return 'url';
  return 'unknown';
}

function pickDominantType(cells: string[]): InferredType {
  const nonNull = cells.filter(function(c) { return !isNull(c); });
  if (nonNull.length === 0) return 'empty';

  const counts: Record<string, number> = {};
  for (let i = 0; i < nonNull.length; i++) {
    const t = inferCellType(nonNull[i]);
    counts[t] = (counts[t] || 0) + 1;
  }

  // Priority order
  const ordered: Array<InferredType | 'unknown'> = ['boolean', 'integer', 'float', 'date', 'email', 'url', 'unknown'];
  for (let oi = 0; oi < ordered.length; oi++) {
    const t = ordered[oi];
    if (counts[t] && counts[t] === nonNull.length) {
      if (t === 'unknown') {
        // Decide between categorical and free text
        const unique = new Set(nonNull).size;
        return (unique / nonNull.length) <= 0.5 ? 'categorical' : 'free text';
      }
      return t as InferredType;
    }
  }

  // Mixed: pick the majority
  let bestType: string = 'unknown';
  let bestCount = 0;
  const keys = Object.keys(counts);
  for (let ki = 0; ki < keys.length; ki++) {
    if (counts[keys[ki]] > bestCount) {
      bestCount = counts[keys[ki]];
      bestType = keys[ki];
    }
  }

  if (bestType === 'unknown') {
    const unique = new Set(nonNull).size;
    return (unique / nonNull.length) <= 0.5 ? 'categorical' : 'free text';
  }

  return bestType as InferredType;
}

function parseCsv(input: string): { headers: string[]; rows: string[][] } {
  const lines = input.split('\n');
  const nonEmpty = lines.filter(function(l) { return l.trim().length > 0; });
  if (nonEmpty.length < 2) throw new Error('CSV must have at least a header row and one data row.');

  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
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
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result.map(function(s) { return s.trim(); });
  }

  const headers = splitCsvLine(nonEmpty[0]);
  const rows: string[][] = [];
  for (let i = 1; i < nonEmpty.length; i++) {
    const row = splitCsvLine(nonEmpty[i]);
    // Pad or trim to match header count
    while (row.length < headers.length) row.push('');
    rows.push(row.slice(0, headers.length));
  }

  return { headers, rows };
}

export function analyzeColumns(input: string): ColumnStats[] {
  const { headers, rows } = parseCsv(input);
  const results: ColumnStats[] = [];

  for (let col = 0; col < headers.length; col++) {
    const cells = rows.map(function(r) { return r[col] || ''; });
    const nullCount = cells.filter(isNull).length;
    const nonNull = cells.filter(function(c) { return !isNull(c); });
    const uniqueValues = Array.from(new Set(cells));
    const uniqueCount = uniqueValues.length;

    const inferredType = pickDominantType(cells);

    // Sample values (up to 5 non-null unique)
    const uniqueNonNull = Array.from(new Set(nonNull)).slice(0, 5);

    const stats: ColumnStats = {
      name: headers[col],
      inferredType: inferredType,
      totalCount: cells.length,
      nullCount: nullCount,
      uniqueCount: uniqueCount,
      sampleValues: uniqueNonNull,
    };

    // Numeric stats
    if (inferredType === 'integer' || inferredType === 'float') {
      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let i = 0; i < nonNull.length; i++) {
        const n = parseFloat(nonNull[i]);
        if (!isNaN(n)) {
          if (n < minVal) minVal = n;
          if (n > maxVal) maxVal = n;
        }
      }
      if (isFinite(minVal)) {
        stats.minValue = minVal;
        stats.maxValue = maxVal;
      }
    } else if (inferredType === 'categorical' || inferredType === 'free text' || inferredType === 'date') {
      // String min/max
      if (nonNull.length > 0) {
        const sorted = nonNull.slice().sort();
        stats.minStr = sorted[0];
        stats.maxStr = sorted[sorted.length - 1];
      }
    }

    results.push(stats);
  }

  return results;
}
