// All functions in this file are pure (no React, no browser APIs).

export type SchemaValidationResult = {
  valid: boolean;
  errors: string[];
};

type Schema = Record<string, unknown>;

function getJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function validateValue(schema: Schema, value: unknown, path: string): string[] {
  const errors: string[] = [];

  // type validation
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const valueType = getJsonType(value);
    // JSON Schema: "integer" is a subtype of "number"
    const matches = types.some((t) => {
      if (t === 'integer') return typeof value === 'number' && Number.isInteger(value);
      if (t === 'number') return typeof value === 'number';
      return t === valueType;
    });
    if (!matches) {
      errors.push(`${path}: expected type "${types.join(' | ')}" but got "${valueType}"`);
      // Don't validate further type-specific constraints
      return errors;
    }
  }

  // enum validation
  if (schema.enum !== undefined) {
    const enumValues = schema.enum as unknown[];
    const found = enumValues.some((e) => JSON.stringify(e) === JSON.stringify(value));
    if (!found) {
      errors.push(`${path}: value must be one of [${enumValues.map((e) => JSON.stringify(e)).join(', ')}]`);
    }
  }

  // string validations
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < (schema.minLength as number)) {
      errors.push(`${path}: string length ${value.length} is less than minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && value.length > (schema.maxLength as number)) {
      errors.push(`${path}: string length ${value.length} exceeds maxLength ${schema.maxLength}`);
    }
    if (schema.pattern !== undefined) {
      try {
        const re = new RegExp(schema.pattern as string);
        if (!re.test(value)) {
          errors.push(`${path}: string does not match pattern "${schema.pattern}"`);
        }
      } catch {
        errors.push(`${path}: invalid pattern "${schema.pattern}"`);
      }
    }
  }

  // number validations
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < (schema.minimum as number)) {
      errors.push(`${path}: value ${value} is less than minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > (schema.maximum as number)) {
      errors.push(`${path}: value ${value} exceeds maximum ${schema.maximum}`);
    }
    if (schema.exclusiveMinimum !== undefined && value <= (schema.exclusiveMinimum as number)) {
      errors.push(`${path}: value ${value} must be greater than exclusiveMinimum ${schema.exclusiveMinimum}`);
    }
    if (schema.exclusiveMaximum !== undefined && value >= (schema.exclusiveMaximum as number)) {
      errors.push(`${path}: value ${value} must be less than exclusiveMaximum ${schema.exclusiveMaximum}`);
    }
  }

  // object validations
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;

    // required
    if (schema.required !== undefined) {
      const required = schema.required as string[];
      for (const field of required) {
        if (!(field in obj)) {
          errors.push(`${path}: required property "${field}" is missing`);
        }
      }
    }

    // properties
    if (schema.properties !== undefined) {
      const properties = schema.properties as Record<string, Schema>;
      for (const [key, propSchema] of Object.entries(properties)) {
        if (key in obj) {
          const subErrors = validateValue(propSchema, obj[key], `${path}.${key}`);
          errors.push(...subErrors);
        }
      }
    }

    // additionalProperties
    if (schema.additionalProperties === false && schema.properties !== undefined) {
      const properties = schema.properties as Record<string, Schema>;
      for (const key of Object.keys(obj)) {
        if (!(key in properties)) {
          errors.push(`${path}: additional property "${key}" is not allowed`);
        }
      }
    }
  }

  // array validations
  if (Array.isArray(value)) {
    if (schema.items !== undefined) {
      const itemSchema = schema.items as Schema;
      value.forEach((item, i) => {
        const subErrors = validateValue(itemSchema, item, `${path}[${i}]`);
        errors.push(...subErrors);
      });
    }
    if (schema.minItems !== undefined && value.length < (schema.minItems as number)) {
      errors.push(`${path}: array length ${value.length} is less than minItems ${schema.minItems}`);
    }
    if (schema.maxItems !== undefined && value.length > (schema.maxItems as number)) {
      errors.push(`${path}: array length ${value.length} exceeds maxItems ${schema.maxItems}`);
    }
  }

  return errors;
}

export function validateSchema(schemaStr: string, dataStr: string): SchemaValidationResult {
  let schema: Schema;
  let data: unknown;

  try {
    schema = JSON.parse(schemaStr) as Schema;
  } catch (e) {
    return { valid: false, errors: [`Invalid schema JSON: ${(e as Error).message}`] };
  }

  try {
    data = JSON.parse(dataStr);
  } catch (e) {
    return { valid: false, errors: [`Invalid data JSON: ${(e as Error).message}`] };
  }

  const errors = validateValue(schema, data, 'root');
  return { valid: errors.length === 0, errors };
}

export function formatValidationResult(result: SchemaValidationResult): string {
  if (result.valid) return '✓ Valid\n\nThe document is valid against the schema.';
  return `✗ Invalid\n\n${result.errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
}
