export function stripTypes(input: string): string {
  let result = input;

  // Remove type imports: import type { ... } from '...'
  result = result.replace(/import\s+type\s+\{[^}]*\}\s+from\s+['"][^'"]*['"]\s*;?\n?/g, '');

  // Remove generic type params: <T>, <T extends U>, <T, U>
  result = result.replace(/<[A-Z][a-zA-Z0-9,\s\[\]&|?<>]*>/g, (match) => {
    // Only remove if it looks like a type param (not JSX)
    if (/^<[A-Z]/.test(match) && !match.includes('=')) return '';
    return match;
  });

  // Remove type assertions: as Type, as const, as primitives
  result = result.replace(/\s+as\s+(?:const|string|number|boolean|any|unknown|never|void|null|undefined|object|bigint|symbol|[A-Z]\w*(?:\[\])*)/g, '');

  // Remove interface declarations (multiline)
  result = result.replace(/^interface\s+\w+\s*\{[^}]*\}\n?/gm, '');

  // Remove type aliases
  result = result.replace(/^type\s+\w+\s*=\s*[^;]+;\n?/gm, '');

  // Remove : TypeAnnotation from variable/param declarations (primitives)
  result = result.replace(/:\s*(?:string|number|boolean|void|any|never|unknown|null|undefined|object|bigint|symbol)\b(\[\])*/g, '');

  // Remove : CapitalisedType annotations
  result = result.replace(/:\s*[A-Z]\w*(?:\[\])*/g, '');

  // Remove readonly keyword
  result = result.replace(/\breadonly\s+/g, '');

  // Remove access modifiers
  result = result.replace(/\b(public|private|protected)\s+/g, '');

  // Remove abstract keyword
  result = result.replace(/\babstract\s+/g, '');

  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

export function removeTypeImports(input: string): string {
  return input.replace(/import\s+type\s+[^;]+;\n?/g, '');
}
