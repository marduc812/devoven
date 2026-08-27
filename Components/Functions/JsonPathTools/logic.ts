export type JsonPathResult = {
  path: string;
  value: unknown;
};

export function evaluateJsonPath(jsonStr: string, path: string): JsonPathResult[] {
  const data = JSON.parse(jsonStr);
  if (!path.startsWith('$')) throw new Error('JSONPath must start with $');

  const results: JsonPathResult[] = [];
  evaluate(data, path.slice(1), '$', results);
  return results;
}

function evaluate(
  node: unknown,
  expr: string,
  currentPath: string,
  results: JsonPathResult[],
): void {
  if (expr === '' || expr === '.') {
    results.push({ path: currentPath, value: node });
    return;
  }

  // Recursive descent: ..key
  if (expr.startsWith('..')) {
    const rest = expr.slice(2);
    const key = rest.split(/[.\[]/)[0];
    // Apply to current
    if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
      const obj = node as Record<string, unknown>;
      if (key in obj) evaluate(obj[key], '', `${currentPath}['${key}']`, results);
      // Recurse into all children
      for (const [k, v] of Object.entries(obj)) {
        evaluate(v, `..${rest}`, `${currentPath}['${k}']`, results);
      }
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        evaluate(node[i], `..${rest}`, `${currentPath}[${i}]`, results);
      }
    }
    return;
  }

  // .key
  if (expr.startsWith('.')) {
    const rest = expr.slice(1);
    if (rest.startsWith('*')) {
      // .*
      if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          evaluate(v, rest.slice(1), `${currentPath}['${k}']`, results);
        }
      }
      return;
    }
    const match = rest.match(/^([^.\[]*)(.*)/);
    if (!match) return;
    const [, key, remaining] = match;
    if (typeof node === 'object' && node !== null && !Array.isArray(node)) {
      const obj = node as Record<string, unknown>;
      if (key in obj) evaluate(obj[key], remaining, `${currentPath}['${key}']`, results);
    }
    return;
  }

  // [index] or [*] or [?(@.x == y)]
  if (expr.startsWith('[')) {
    const closeIdx = expr.indexOf(']');
    if (closeIdx < 0) return;
    const subscript = expr.slice(1, closeIdx);
    const rest = expr.slice(closeIdx + 1);

    if (subscript === '*') {
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++)
          evaluate(node[i], rest, `${currentPath}[${i}]`, results);
      } else if (typeof node === 'object' && node !== null) {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          evaluate(v, rest, `${currentPath}['${k}']`, results);
        }
      }
      return;
    }

    if (/^\d+$/.test(subscript)) {
      const idx = parseInt(subscript);
      if (Array.isArray(node) && idx < node.length) {
        evaluate(node[idx], rest, `${currentPath}[${idx}]`, results);
      }
      return;
    }

    // Filter: ?(@.key == value) or ?(@.key)
    if (subscript.startsWith('?(') && subscript.endsWith(')')) {
      const filter = subscript.slice(2, -1); // @.key == value
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          if (matchesFilter(node[i], filter)) {
            evaluate(node[i], rest, `${currentPath}[${i}]`, results);
          }
        }
      }
      return;
    }
  }
}

function matchesFilter(item: unknown, filter: string): boolean {
  // Supports: @.key, @.key == value, @.key != value, @.key > value, @.key < value
  const match = filter.match(/^@\.(\w+)(?:\s*(==|!=|>|<|>=|<=)\s*(.+))?$/);
  if (!match) return false;
  const [, key, op, rawVal] = match;
  const obj = item as Record<string, unknown>;
  if (!(key in obj)) return false;
  if (!op) return true; // just existence check

  const actual = obj[key];
  let expected: unknown = rawVal;
  if (rawVal === 'true') expected = true;
  else if (rawVal === 'false') expected = false;
  else if (rawVal === 'null') expected = null;
  else if (/^-?\d+(\.\d+)?$/.test(rawVal)) expected = Number(rawVal);
  else if (rawVal.startsWith('"') || rawVal.startsWith("'"))
    expected = rawVal.slice(1, -1);

  switch (op) {
    case '==':
      return actual == expected;
    case '!=':
      return actual != expected;
    case '>':
      return (actual as number) > (expected as number);
    case '<':
      return (actual as number) < (expected as number);
    case '>=':
      return (actual as number) >= (expected as number);
    case '<=':
      return (actual as number) <= (expected as number);
  }
  return false;
}

export function formatJsonPathResults(results: JsonPathResult[]): string {
  if (results.length === 0) return 'No matches found';
  return results
    .map((r, i) => `[${i}] ${r.path}\n    ${JSON.stringify(r.value)}`)
    .join('\n\n');
}
