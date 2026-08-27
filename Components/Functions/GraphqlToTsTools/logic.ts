// Pure TypeScript — no browser APIs.

const SCALAR_MAP: Record<string, string> = {
  String: 'string',
  Int: 'number',
  Float: 'number',
  Boolean: 'boolean',
  ID: 'string',
};

function mapScalar(typeName: string): string {
  return SCALAR_MAP[typeName] || typeName;
}

/** Strip comments from GraphQL source */
function stripComments(src: string): string {
  return src.replace(/#[^\n]*/g, '');
}

/** Parse a field type like [String!]! → { tsType, optional } */
function parseFieldType(raw: string): { tsType: string; optional: boolean } {
  let s = raw.trim();
  // outer non-null
  const outerNonNull = s.endsWith('!');
  if (outerNonNull) s = s.slice(0, -1).trim();

  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    const innerNonNull = inner.endsWith('!');
    const innerType = innerNonNull ? inner.slice(0, -1).trim() : inner.trim();
    const tsInner = mapScalar(innerType);
    return { tsType: tsInner + '[]', optional: !outerNonNull };
  }

  return { tsType: mapScalar(s), optional: !outerNonNull };
}

interface GraphQLField {
  name: string;
  tsType: string;
  optional: boolean;
}

interface GraphQLTypeDef {
  kind: 'type' | 'input' | 'interface' | 'enum' | 'scalar' | 'union';
  name: string;
  interfaces?: string[];
  fields?: GraphQLField[];
  values?: string[];
  types?: string[];  // for union
}

/** Parse one block's fields */
function parseFields(body: string): GraphQLField[] {
  const fields: GraphQLField[] = [];
  // Remove argument lists: fieldName(arg: Type, ...): ReturnType
  const noArgs = body.replace(/\([^)]*\)/g, '');
  // Match: identifier : TypeExpr  where TypeExpr can be scalar, [Type], [Type!], [Type!]!, etc.
  const fieldRe = /(\w+)\s*:\s*(\[[\w!]+\]!?|\w+!?)/g;
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(noArgs)) !== null) {
    const fieldName = m[1];
    const rawType = m[2];
    const { tsType, optional } = parseFieldType(rawType);
    fields.push({ name: fieldName, tsType, optional });
  }
  return fields;
}

/** Parse the full GraphQL schema string into type definitions */
export function parseGraphQLSchema(src: string): GraphQLTypeDef[] {
  const cleaned = stripComments(src);
  const defs: GraphQLTypeDef[] = [];

  // Match top-level blocks
  const blockRe = /\b(type|input|interface|enum|scalar|union)\s+(\w+)\s*(?:implements\s+([\w\s&]+?))?\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(cleaned)) !== null) {
    const kind = match[1] as GraphQLTypeDef['kind'];
    const name = match[2];
    const implementsStr = match[3] ? match[3].trim() : '';
    const body = match[4];

    if (kind === 'enum') {
      // Split by newlines OR whitespace to handle single-line enums
      const rawValues = body.split(/[\n\s]+/)
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#') && /^\w+$/.test(l));
      defs.push({ kind: 'enum', name, values: rawValues });
    } else if (kind === 'scalar') {
      defs.push({ kind: 'scalar', name });
    } else {
      const ifaces = implementsStr
        ? implementsStr.split('&').map(s => s.trim()).filter(Boolean)
        : [];
      const fields = parseFields(body);
      defs.push({ kind, name, interfaces: ifaces, fields });
    }
  }

  // Handle unions separately (they use = not {})
  const unionRe = /\bunion\s+(\w+)\s*=\s*([^\n{]+)/g;
  while ((match = unionRe.exec(cleaned)) !== null) {
    const name = match[1];
    const types = match[2].split('|').map(s => s.trim()).filter(Boolean);
    defs.push({ kind: 'union', name, types });
  }

  return defs;
}

/** Convert parsed definitions to TypeScript */
export function defsToTypeScript(defs: GraphQLTypeDef[]): string {
  const lines: string[] = [];

  for (const def of defs) {
    if (def.kind === 'scalar') {
      lines.push(`// GraphQL scalar: ${def.name}`);
      lines.push(`export type ${def.name} = string;\n`);
      continue;
    }

    if (def.kind === 'union') {
      const types = (def.types || []).join(' | ');
      lines.push(`export type ${def.name} = ${types};\n`);
      continue;
    }

    if (def.kind === 'enum') {
      lines.push(`export enum ${def.name} {`);
      for (const v of def.values || []) {
        lines.push(`  ${v} = '${v}',`);
      }
      lines.push('}\n');
      continue;
    }

    // type, input, interface → TypeScript interface
    const ifaces = def.interfaces && def.interfaces.length > 0
      ? ' extends ' + def.interfaces.join(', ')
      : '';
    lines.push(`export interface ${def.name}${ifaces} {`);
    for (const f of def.fields || []) {
      const opt = f.optional ? '?' : '';
      lines.push(`  ${f.name}${opt}: ${f.tsType};`);
    }
    lines.push('}\n');
  }

  return lines.join('\n');
}

/** Main conversion entry point */
export function graphqlToTypeScript(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const defs = parseGraphQLSchema(trimmed);
  if (defs.length === 0) {
    return '// No recognized GraphQL type definitions found.\n// Supported: type, input, interface, enum, scalar, union';
  }

  const ts = defsToTypeScript(defs);
  return ts.trim();
}
