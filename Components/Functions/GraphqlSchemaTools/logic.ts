// GraphQL Schema Builder logic

export type GqlField = {
  name: string;
  gqlType: string;
  nullable: boolean;
  isList: boolean;
};

export type GqlType = {
  name: string;
  fields: GqlField[];
};

function toTypeName(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function inferGqlScalar(value: unknown, fieldKey?: string): string {
  if (value === null || value === undefined) return 'String';
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int' : 'Float';
  }
  if (typeof value === 'string') {
    // Heuristic: looks like an ID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return 'ID';
    }
    if (fieldKey === 'id' || fieldKey === '_id' || fieldKey === 'Id') return 'ID';
    return 'String';
  }
  return 'String';
}

function inferGqlType(
  key: string,
  value: unknown,
  types: Map<string, GqlType>,
  _parentTypeName: string
): { gqlType: string; nullable: boolean; isList: boolean } {
  if (value === null || value === undefined) {
    return { gqlType: 'String', nullable: true, isList: false };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { gqlType: 'String', nullable: false, isList: true };
    }
    const first = value[0];
    if (first !== null && typeof first === 'object' && !Array.isArray(first)) {
      const nestedTypeName = toTypeName(key.replace(/s$/, ''));
      buildGqlType(nestedTypeName, first as Record<string, unknown>, types);
      return { gqlType: nestedTypeName, nullable: false, isList: true };
    }
    return { gqlType: inferGqlScalar(first, key), nullable: false, isList: true };
  }

  if (typeof value === 'object') {
    const nestedTypeName = toTypeName(key);
    buildGqlType(nestedTypeName, value as Record<string, unknown>, types);
    return { gqlType: nestedTypeName, nullable: false, isList: false };
  }

  const scalar = inferGqlScalar(value, key);

  return { gqlType: scalar, nullable: false, isList: false };
}

function buildGqlType(
  typeName: string,
  obj: Record<string, unknown>,
  types: Map<string, GqlType>
): void {
  if (types.has(typeName)) return;

  const fields: GqlField[] = [];
  // placeholder to avoid infinite recursion
  types.set(typeName, { name: typeName, fields });

  for (const [key, value] of Object.entries(obj)) {
    const { gqlType, nullable, isList } = inferGqlType(key, value, types, typeName);
    fields.push({ name: key, gqlType, nullable, isList });
  }
}

function fieldToString(f: GqlField): string {
  let t = f.gqlType;
  if (f.isList) t = `[${t}!]`;
  if (!f.nullable) t = `${t}!`;
  return `  ${f.name}: ${t}`;
}

function typeToString(t: GqlType): string {
  return `type ${t.name} {\n${t.fields.map(fieldToString).join('\n')}\n}`;
}

function buildExampleQuery(rootType: GqlType, allTypes: Map<string, GqlType>, depth: number = 0): string {
  if (depth > 2) return '';
  const indent = '  '.repeat(depth + 1);
  const lines: string[] = [];
  for (const f of rootType.fields) {
    const nested = allTypes.get(f.gqlType);
    if (nested && depth < 2) {
      lines.push(`${indent}${f.name} {`);
      lines.push(buildExampleQuery(nested, allTypes, depth + 1));
      lines.push(`${indent}}`);
    } else {
      lines.push(`${indent}${f.name}`);
    }
  }
  return lines.join('\n');
}

export function generateGraphqlSchema(input: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return 'Error: Invalid JSON input';
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return 'Error: Input must be a JSON object (not array or null)';
  }

  const types = new Map<string, GqlType>();
  buildGqlType('Root', parsed as Record<string, unknown>, types);

  const typeStrings = Array.from(types.values()).map(typeToString);

  // Build example query
  const rootType = types.get('Root');
  let exampleQuery = '';
  if (rootType) {
    const queryBody = buildExampleQuery(rootType, types);
    exampleQuery = `\n# Example Query\nquery ExampleQuery {\n  root {\n${queryBody}\n  }\n}`;
  }

  return typeStrings.join('\n\n') + exampleQuery;
}
