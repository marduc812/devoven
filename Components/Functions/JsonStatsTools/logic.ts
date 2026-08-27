export type JsonStats = {
  totalKeys: number;
  maxDepth: number;
  arrays: number;
  objects: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  longestKey: string;
  longestString: string;
};

export function analyzeJson(input: string): JsonStats {
  const data = JSON.parse(input);
  const stats: JsonStats = {
    totalKeys: 0, maxDepth: 0, arrays: 0, objects: 0,
    strings: 0, numbers: 0, booleans: 0, nulls: 0,
    longestKey: '', longestString: '',
  };

  function walk(node: unknown, depth: number): void {
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    if (node === null) { stats.nulls++; return; }
    if (typeof node === 'string') {
      stats.strings++;
      if (node.length > stats.longestString.length) stats.longestString = node;
      return;
    }
    if (typeof node === 'number') { stats.numbers++; return; }
    if (typeof node === 'boolean') { stats.booleans++; return; }
    if (Array.isArray(node)) {
      stats.arrays++;
      for (const item of node) walk(item, depth + 1);
      return;
    }
    if (typeof node === 'object') {
      stats.objects++;
      for (const [key, val] of Object.entries(node as Record<string, unknown>)) {
        stats.totalKeys++;
        if (key.length > stats.longestKey.length) stats.longestKey = key;
        walk(val, depth + 1);
      }
    }
  }

  walk(data, 0);
  return stats;
}

export function formatJsonStats(stats: JsonStats): string {
  const total = stats.strings + stats.numbers + stats.booleans + stats.nulls + stats.arrays + stats.objects;
  return [
    `Objects:      ${stats.objects}`,
    `Arrays:       ${stats.arrays}`,
    `Keys:         ${stats.totalKeys}`,
    `Max depth:    ${stats.maxDepth}`,
    ``,
    `Value types:`,
    `  Strings:   ${stats.strings}`,
    `  Numbers:   ${stats.numbers}`,
    `  Booleans:  ${stats.booleans}`,
    `  Nulls:     ${stats.nulls}`,
    `  Total:     ${total}`,
    ``,
    `Longest key:    "${stats.longestKey}"`,
    `Longest string: "${stats.longestString.substring(0, 50)}${stats.longestString.length > 50 ? '...' : ''}"`,
  ].join('\n');
}
