export type CssVariable = {
  name: string;
  value: string;
  selector: string;
};

export function extractCssVariables(css: string): CssVariable[] {
  const result: CssVariable[] = [];
  // Match selector blocks
  const blockRegex = /([^{}]*)\{([^{}]*)\}/gs;
  let blockMatch;
  while ((blockMatch = blockRegex.exec(css)) !== null) {
    const selector = blockMatch[1].trim();
    const block = blockMatch[2];
    // Find CSS variables in block
    const varRegex = /(-{2}[\w-]+)\s*:\s*([^;]+);?/g;
    let varMatch;
    while ((varMatch = varRegex.exec(block)) !== null) {
      result.push({
        name: varMatch[1].trim(),
        value: varMatch[2].trim(),
        selector,
      });
    }
  }
  return result;
}

export function formatCssVariables(vars: CssVariable[]): string {
  if (vars.length === 0) return 'No CSS variables found.';

  // Group by selector
  const bySelector = new Map<string, CssVariable[]>();
  for (const v of vars) {
    if (!bySelector.has(v.selector)) bySelector.set(v.selector, []);
    bySelector.get(v.selector)!.push(v);
  }

  const lines: string[] = [`Found ${vars.length} variable(s):\n`];
  for (const [selector, svars] of bySelector) {
    lines.push(`${selector} {`);
    for (const v of svars) {
      lines.push(`  ${v.name}: ${v.value};`);
    }
    lines.push('}');
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function cssVariablesToJson(vars: CssVariable[]): string {
  const obj: Record<string, string> = {};
  for (const v of vars) obj[v.name] = v.value;
  return JSON.stringify(obj, null, 2);
}
