// Components/Functions/SampleSizeTools/logic.ts
// Pure logic — no browser APIs.

/**
 * Z-values for common confidence levels.
 */
const Z_VALUES: Record<number, number> = {
  90: 1.645,
  95: 1.96,
  99: 2.576,
};

export interface SampleSizeInput {
  population: number; // use Infinity for unknown/infinite population
  confidence: number; // 90 | 95 | 99
  marginOfError: number; // as a percentage, e.g. 5 for 5%
}

export interface SampleSizeResult {
  sampleSize: number;
  infiniteSampleSize: number; // before finite population correction
  zValue: number;
  formulaExplanation: string;
  table: SampleSizeTableRow[];
}

export interface SampleSizeTableRow {
  confidence: number;
  marginOfError: number;
  sampleSize: number;
}

/**
 * Cochran formula for infinite population:
 *   n₀ = z² * p * (1-p) / e²
 * where p = 0.5 (maximum variance), e = margin of error (proportion)
 *
 * Finite population correction:
 *   n = n₀ / (1 + (n₀ - 1) / N)
 */
export function computeSampleSize(population: number, confidence: number, marginOfErrorPct: number): number {
  const z = Z_VALUES[confidence];
  if (!z) throw new Error('Confidence level must be 90, 95, or 99.');
  if (marginOfErrorPct <= 0 || marginOfErrorPct >= 100) {
    throw new Error('Margin of error must be between 0 and 100 (exclusive).');
  }

  const e = marginOfErrorPct / 100;
  const p = 0.5; // worst-case proportion
  const n0 = (z * z * p * (1 - p)) / (e * e);

  if (!isFinite(population) || population <= 0) {
    return Math.ceil(n0);
  }

  // Finite population correction
  const n = n0 / (1 + (n0 - 1) / population);
  return Math.ceil(n);
}

export function computeInfiniteSampleSize(confidence: number, marginOfErrorPct: number): number {
  const z = Z_VALUES[confidence];
  if (!z) return 0;
  const e = marginOfErrorPct / 100;
  const p = 0.5;
  const n0 = (z * z * p * (1 - p)) / (e * e);
  return Math.ceil(n0);
}

export function buildTable(population: number): SampleSizeTableRow[] {
  const confidenceLevels = [90, 95, 99];
  const margins = [1, 2, 3, 5, 10];
  const rows: SampleSizeTableRow[] = [];
  for (let ci = 0; ci < confidenceLevels.length; ci++) {
    for (let mi = 0; mi < margins.length; mi++) {
      const confidence = confidenceLevels[ci];
      const marginOfError = margins[mi];
      try {
        const sz = computeSampleSize(population, confidence, marginOfError);
        rows.push({ confidence: confidence, marginOfError: marginOfError, sampleSize: sz });
      } catch {
        // skip invalid combinations
      }
    }
  }
  return rows;
}

function pad(s: string, width: number): string {
  while (s.length < width) s = ' ' + s;
  return s;
}

export function processSampleSize(input: string): string {
  const lines = input.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  if (lines.length < 3) throw new Error('Enter three lines: population size (or "infinite"), confidence level (90/95/99), margin of error %.');

  let population: number;
  const popStr = lines[0].toLowerCase();
  if (popStr === 'infinite' || popStr === 'inf' || popStr === '∞' || popStr === 'unknown') {
    population = Infinity;
  } else {
    population = parseFloat(lines[0]);
    if (isNaN(population) || population <= 0) throw new Error('Population must be a positive number or "infinite".');
  }

  const confidence = parseInt(lines[1], 10);
  if (confidence !== 90 && confidence !== 95 && confidence !== 99) {
    throw new Error('Confidence level must be 90, 95, or 99.');
  }

  const marginOfError = parseFloat(lines[2]);
  if (isNaN(marginOfError)) throw new Error('Margin of error must be a number.');

  const z = Z_VALUES[confidence];
  const n0 = computeInfiniteSampleSize(confidence, marginOfError);
  const n = computeSampleSize(population, confidence, marginOfError);

  const populationStr = isFinite(population) ? population.toLocaleString() : 'Infinite';

  const output: string[] = [
    '=== Sample Size Calculation ===',
    '',
    'Population (N):           ' + populationStr,
    'Confidence Level:         ' + confidence + '%  (z = ' + z.toFixed(3) + ')',
    'Margin of Error (e):      ' + marginOfError + '%',
    '',
    'Infinite Population n₀:   ' + n0.toLocaleString(),
    isFinite(population)
      ? 'Adjusted Sample Size:     ' + n.toLocaleString() + '  (finite population correction)'
      : 'Required Sample Size:     ' + n.toLocaleString(),
    '',
    'Formula:',
    '  n₀ = z² × p(1-p) / e²',
    '     = ' + z.toFixed(3) + '² × 0.5 × 0.5 / ' + (marginOfError / 100).toFixed(4) + '²',
    '     = ' + n0,
    isFinite(population)
      ? '  n  = n₀ / (1 + (n₀ − 1) / N) = ' + n
      : '',
    '  (p = 0.5 used for maximum variance)',
    '',
    '=== Sample Size Table for Population: ' + populationStr + ' ===',
    '',
    'Confidence  Margin 1%  Margin 2%  Margin 3%  Margin 5%  Margin 10%',
    '----------  ---------  ---------  ---------  ---------  ----------',
  ];

  const confidenceLevels = [90, 95, 99];
  const margins = [1, 2, 3, 5, 10];

  for (let ci = 0; ci < confidenceLevels.length; ci++) {
    const cl = confidenceLevels[ci];
    const cells: string[] = [pad(cl + '%', 10)];
    for (let mi = 0; mi < margins.length; mi++) {
      try {
        const sz = computeSampleSize(population, cl, margins[mi]);
        cells.push(pad(sz.toLocaleString(), 9 + (mi === 4 ? 1 : 0)));
      } catch {
        cells.push(pad('N/A', 9));
      }
    }
    output.push(cells.join('  '));
  }

  return output.filter(function(l) { return l !== undefined; }).join('\n');
}
