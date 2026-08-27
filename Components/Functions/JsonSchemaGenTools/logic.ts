// All functions in this file are pure (no React, no browser APIs).

const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const URI_RE = /^https?:\/\//;

function inferFormat(value: string): string | undefined {
  if (DATE_TIME_RE.test(value)) return 'date-time';
  if (DATE_RE.test(value)) return 'date';
  if (EMAIL_RE.test(value)) return 'email';
  if (URI_RE.test(value)) return 'uri';
  return undefined;
}

type JsonSchema = {
  $schema?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  format?: string;
  enum?: unknown[];
  additionalProperties?: boolean | JsonSchema;
};

function inferSchema(value: unknown): JsonSchema {
  if (value === null) return { type: 'null' };

  if (typeof value === 'boolean') return { type: 'boolean' };

  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
  }

  if (typeof value === 'string') {
    const schema: JsonSchema = { type: 'string' };
    const fmt = inferFormat(value);
    if (fmt) schema.format = fmt;
    return schema;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array' };
    // Infer item type from first element, merge with rest
    const itemSchema = mergeSchemas(value.map(item => inferSchema(item)));
    return { type: 'array', items: itemSchema };
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const key of Object.keys(obj)) {
      const v = obj[key];
      properties[key] = inferSchema(v);
      if (v !== null) {
        required.push(key);
      }
    }

    const schema: JsonSchema = { type: 'object', properties };
    if (required.length > 0) schema.required = required;
    return schema;
  }

  return {};
}

function mergeSchemas(schemas: JsonSchema[]): JsonSchema {
  if (schemas.length === 0) return {};
  if (schemas.length === 1) return schemas[0];

  const types = new Set<string>();
  for (const s of schemas) {
    if (typeof s.type === 'string') types.add(s.type);
    else if (Array.isArray(s.type)) s.type.forEach(t => types.add(t));
  }

  if (types.size === 1) {
    const type = Array.from(types)[0];
    if (type === 'object') {
      // Merge object schemas
      const allKeys = new Set<string>();
      for (const s of schemas) {
        if (s.properties) Object.keys(s.properties).forEach(k => allKeys.add(k));
      }

      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];

      allKeys.forEach(key => {
        const subSchemas: JsonSchema[] = [];
        for (const s of schemas) {
          if (s.properties && s.properties[key]) {
            subSchemas.push(s.properties[key]);
          }
        }
        properties[key] = mergeSchemas(subSchemas);

        // Field is required only if ALL schemas have it as required
        const allRequired = schemas.every(s => s.required && s.required.includes(key));
        if (allRequired) required.push(key);
      });

      const merged: JsonSchema = { type: 'object', properties };
      if (required.length > 0) merged.required = required;
      return merged;
    }
    return { type };
  }

  // Mixed types — use oneOf pattern via union type
  return { type: Array.from(types) as string[] };
}

export function generateJsonSchema(input: string): string {
  if (!input.trim()) return '';
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    throw new Error('Invalid JSON: ' + (e instanceof Error ? e.message : 'parse error'));
  }

  const schema = inferSchema(data);
  schema.$schema = 'http://json-schema.org/draft-07/schema#';

  // Move $schema to front
  const ordered: JsonSchema = { $schema: schema.$schema };
  if (schema.type !== undefined) ordered.type = schema.type;
  if (schema.properties !== undefined) ordered.properties = schema.properties;
  if (schema.required !== undefined) ordered.required = schema.required;
  if (schema.items !== undefined) ordered.items = schema.items;
  if (schema.format !== undefined) ordered.format = schema.format;

  return JSON.stringify(ordered, null, 2);
}
