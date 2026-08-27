// JSON Sorter - sort JSON keys alphabetically (deeply)

export function sortJsonKeys(input: string): string {
  if (!input.trim()) return '';
  const parsed = JSON.parse(input);
  return JSON.stringify(sortValue(parsed), null, 2);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    Object.keys(obj).sort((a, b) => a.localeCompare(b)).forEach(key => {
      sorted[key] = sortValue(obj[key]);
    });
    return sorted;
  }
  return value;
}

export function sortJsonKeysMinified(input: string): string {
  if (!input.trim()) return '';
  const parsed = JSON.parse(input);
  return JSON.stringify(sortValue(parsed));
}

export type SortResult = {
  sorted: string;
  keyCount: number;
  depth: number;
};

function countKeys(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((acc: number, v) => acc + countKeys(v), 0);
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return Object.keys(obj).length + Object.values(obj).reduce((acc: number, v) => acc + countKeys(v), 0);
  }
  return 0;
}

function maxDepth(value: unknown, current: number = 0): number {
  if (Array.isArray(value)) {
    if (value.length === 0) return current + 1;
    return Math.max(...value.map(v => maxDepth(v, current + 1)));
  }
  if (value !== null && typeof value === 'object') {
    const vals = Object.values(value as Record<string, unknown>);
    if (vals.length === 0) return current + 1;
    return Math.max(...vals.map(v => maxDepth(v, current + 1)));
  }
  return current;
}

export function sortJson(input: string): SortResult {
  if (!input.trim()) throw new Error('Empty input');
  const parsed = JSON.parse(input);
  const sorted = JSON.stringify(sortValue(parsed), null, 2);
  return {
    sorted,
    keyCount: countKeys(parsed),
    depth: maxDepth(parsed),
  };
}
