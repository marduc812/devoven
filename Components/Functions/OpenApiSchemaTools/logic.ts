// OpenAPI Schema Generator logic

export type SchemaNode =
  | { type: 'string' }
  | { type: 'number' }
  | { type: 'integer' }
  | { type: 'boolean' }
  | { type: 'null' }
  | { type: 'array'; items: SchemaNode }
  | { type: 'object'; properties: Record<string, SchemaNode>; required: string[] };

export function inferType(value: unknown): SchemaNode {
  if (value === null) return { type: 'null' };
  if (typeof value === 'boolean') return { type: 'boolean' };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
  }
  if (typeof value === 'string') return { type: 'string' };
  if (Array.isArray(value)) {
    const items: SchemaNode = value.length > 0 ? inferType(value[0]) : { type: 'string' };
    return { type: 'array', items };
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const properties: Record<string, SchemaNode> = {};
    const required: string[] = [];
    for (const key of Object.keys(obj)) {
      properties[key] = inferType(obj[key]);
      if (obj[key] !== null && obj[key] !== undefined) {
        required.push(key);
      }
    }
    return { type: 'object', properties, required };
  }
  return { type: 'string' };
}

function schemaNodeToObject(node: SchemaNode): Record<string, unknown> {
  if (node.type === 'object') {
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node.properties)) {
      props[k] = schemaNodeToObject(v);
    }
    return {
      type: 'object',
      properties: props,
      required: node.required,
    };
  }
  if (node.type === 'array') {
    return {
      type: 'array',
      items: schemaNodeToObject(node.items),
    };
  }
  return { type: node.type };
}

export function generateOpenApiSchema(input: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return 'Error: Invalid JSON input';
  }

  const schema = inferType(parsed);
  const schemaObj = schemaNodeToObject(schema);

  const openApiSchema = {
    openapi: '3.0.0',
    components: {
      schemas: {
        GeneratedSchema: schemaObj,
      },
    },
  };

  return JSON.stringify(openApiSchema, null, 2);
}

export function generateSchemaOnly(input: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return 'Error: Invalid JSON input';
  }

  const schema = inferType(parsed);
  const schemaObj = schemaNodeToObject(schema);
  return JSON.stringify(schemaObj, null, 2);
}
