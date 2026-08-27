// Components/Functions/DataSamplerTools/logic.ts

export type DataSamplerMode = 'sample' | 'shuffle' | 'split' | 'deduplicate' | 'sort';

export function parseLines(input: string): string[] {
  return input.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
}

/** Fisher-Yates shuffle (returns a new array) */
export function shuffleArray(arr: string[]): string[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/** Random sample of n items without replacement */
export function sampleArray(arr: string[], n: number): string[] {
  if (n >= arr.length) return shuffleArray(arr);
  const shuffled = shuffleArray(arr);
  return shuffled.slice(0, n);
}

/** Split into train/test */
export function splitArray(arr: string[], trainRatio: number): { train: string[]; test: string[] } {
  const shuffled = shuffleArray(arr);
  const trainSize = Math.round(shuffled.length * trainRatio);
  return {
    train: shuffled.slice(0, trainSize),
    test: shuffled.slice(trainSize),
  };
}

/** Deduplicate (preserve first occurrence) */
export function deduplicateArray(arr: string[]): string[] {
  const seen: Record<string, boolean> = {};
  const result: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (!seen[arr[i]]) {
      seen[arr[i]] = true;
      result.push(arr[i]);
    }
  }
  return result;
}

/** Sort alphabetically or numerically */
export function sortArray(arr: string[], numeric: boolean): string[] {
  const copy = arr.slice();
  if (numeric) {
    copy.sort(function(a, b) {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  } else {
    copy.sort(function(a, b) { return a.localeCompare(b); });
  }
  return copy;
}

export function processSampler(
  input: string,
  mode: DataSamplerMode,
  sampleSize: number,
  trainRatio: number,
  numericSort: boolean,
): string {
  const items = parseLines(input);
  if (items.length === 0) throw new Error('No items provided. Enter one item per line.');

  switch (mode) {
    case 'sample': {
      if (sampleSize < 1) throw new Error('Sample size must be at least 1.');
      const sampled = sampleArray(items, sampleSize);
      return '--- Sample (' + sampled.length + ' of ' + items.length + ' items) ---\n' + sampled.join('\n');
    }
    case 'shuffle': {
      const shuffled = shuffleArray(items);
      return '--- Shuffled (' + shuffled.length + ' items) ---\n' + shuffled.join('\n');
    }
    case 'split': {
      if (trainRatio <= 0 || trainRatio >= 1) throw new Error('Train ratio must be between 0 and 1 (exclusive).');
      const { train, test } = splitArray(items, trainRatio);
      const pct = Math.round(trainRatio * 100);
      return (
        '--- Train set (' + train.length + ' items, ' + pct + '%) ---\n' +
        train.join('\n') +
        '\n\n--- Test set (' + test.length + ' items, ' + (100 - pct) + '%) ---\n' +
        test.join('\n')
      );
    }
    case 'deduplicate': {
      const deduped = deduplicateArray(items);
      const removed = items.length - deduped.length;
      return '--- Deduplicated (' + deduped.length + ' items, ' + removed + ' duplicates removed) ---\n' + deduped.join('\n');
    }
    case 'sort': {
      const sorted = sortArray(items, numericSort);
      const label = numericSort ? 'Numerically' : 'Alphabetically';
      return '--- Sorted ' + label + ' (' + sorted.length + ' items) ---\n' + sorted.join('\n');
    }
    default:
      throw new Error('Unknown mode.');
  }
}
