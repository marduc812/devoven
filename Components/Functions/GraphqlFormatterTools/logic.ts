export function formatGraphQL(input: string): string {
  if (!input.trim()) throw new Error('Empty input');
  let result = input.trim();

  // Normalize whitespace
  result = result.replace(/\s+/g, ' ');

  // Add newlines after opening braces
  result = result.replace(/\{/g, ' {\n');
  result = result.replace(/\}/g, '\n}');

  // Add newlines after commas in argument lists
  result = result.replace(/,\s*/g, ',\n');

  // Indent
  const lines = result.split('\n').filter(l => l.trim());
  let indent = 0;
  const formatted: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('}')) indent = Math.max(0, indent - 1);
    formatted.push('  '.repeat(indent) + trimmed);
    if (trimmed.endsWith('{')) indent++;
  }

  return formatted.join('\n');
}

export function extractGraphQLOperations(input: string): string[] {
  const ops: string[] = [];
  const matches = input.matchAll(/\b(query|mutation|subscription|fragment)\s+(\w+)/g);
  for (const m of matches) {
    ops.push(`${m[1]} ${m[2]}`);
  }
  return ops;
}

export function validateGraphQLBasic(input: string): string[] {
  const errors: string[] = [];
  const opens = (input.match(/\{/g) || []).length;
  const closes = (input.match(/\}/g) || []).length;
  if (opens !== closes) errors.push(`Unbalanced braces: ${opens} opening, ${closes} closing`);

  const openParens = (input.match(/\(/g) || []).length;
  const closeParens = (input.match(/\)/g) || []).length;
  if (openParens !== closeParens) errors.push(`Unbalanced parentheses`);

  return errors;
}
