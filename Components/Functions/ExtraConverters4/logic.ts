// ─── C1. JSON Diff ────────────────────────────────────────────────────────────

export type DiffResult = {path: string; type: 'added' | 'removed' | 'changed' | 'unchanged'; oldValue?: unknown; newValue?: unknown};

export function diffJson(aStr: string, bStr: string): DiffResult[] {
  if (!aStr.trim() || !bStr.trim()) throw new Error('Both inputs required');
  const a = JSON.parse(aStr);
  const b = JSON.parse(bStr);
  return diffObjects(a, b, '');
}

function diffObjects(a: unknown, b: unknown, path: string): DiffResult[] {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];

  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    return [{path: path || '(root)', type: 'changed', oldValue: a, newValue: b}];
  }

  if (typeof a !== 'object' || a === null || b === null) {
    return [{path: path || '(root)', type: 'changed', oldValue: a, newValue: b}];
  }

  const results: DiffResult[] = [];
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

  for (const key of allKeys) {
    const p = path ? `${path}.${key}` : key;
    if (!(key in aObj)) results.push({path: p, type: 'added', newValue: bObj[key]});
    else if (!(key in bObj)) results.push({path: p, type: 'removed', oldValue: aObj[key]});
    else results.push(...diffObjects(aObj[key], bObj[key], p));
  }

  return results;
}

export function formatDiffResults(diffs: DiffResult[]): string {
  if (diffs.length === 0) return 'No differences found — JSON objects are identical.';
  return diffs.map(d => {
    if (d.type === 'added') return `+ ${d.path}: ${JSON.stringify(d.newValue)}`;
    if (d.type === 'removed') return `- ${d.path}: ${JSON.stringify(d.oldValue)}`;
    return `~ ${d.path}: ${JSON.stringify(d.oldValue)} → ${JSON.stringify(d.newValue)}`;
  }).join('\n');
}
