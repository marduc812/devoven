import { validateSchema, formatValidationResult } from '../Components/Functions/JsonSchemaTools/logic';

describe('validateSchema', () => {
  it('returns valid for simple matching type', () => {
    const result = validateSchema('{"type":"string"}', '"hello"');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid for mismatched type', () => {
    const result = validateSchema('{"type":"number"}', '"hello"');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates object type with required fields', () => {
    const schema = JSON.stringify({ type: 'object', required: ['name', 'age'], properties: { name: { type: 'string' }, age: { type: 'number' } } });
    const data = JSON.stringify({ name: 'Alice', age: 30 });
    expect(validateSchema(schema, data).valid).toBe(true);
  });

  it('fails when required field is missing', () => {
    const schema = JSON.stringify({ type: 'object', required: ['name'], properties: { name: { type: 'string' } } });
    const data = JSON.stringify({ age: 30 });
    const result = validateSchema(schema, data);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('name'))).toBe(true);
  });

  it('validates minimum', () => {
    const schema = JSON.stringify({ type: 'number', minimum: 10 });
    expect(validateSchema(schema, '5').valid).toBe(false);
    expect(validateSchema(schema, '15').valid).toBe(true);
  });

  it('validates maximum', () => {
    const schema = JSON.stringify({ type: 'number', maximum: 100 });
    expect(validateSchema(schema, '150').valid).toBe(false);
    expect(validateSchema(schema, '50').valid).toBe(true);
  });

  it('validates minLength', () => {
    const schema = JSON.stringify({ type: 'string', minLength: 5 });
    expect(validateSchema(schema, '"hi"').valid).toBe(false);
    expect(validateSchema(schema, '"hello"').valid).toBe(true);
  });

  it('validates maxLength', () => {
    const schema = JSON.stringify({ type: 'string', maxLength: 3 });
    expect(validateSchema(schema, '"hello"').valid).toBe(false);
    expect(validateSchema(schema, '"hi"').valid).toBe(true);
  });

  it('validates enum', () => {
    const schema = JSON.stringify({ enum: ['red', 'green', 'blue'] });
    expect(validateSchema(schema, '"red"').valid).toBe(true);
    expect(validateSchema(schema, '"yellow"').valid).toBe(false);
  });

  it('validates pattern', () => {
    const schema = JSON.stringify({ type: 'string', pattern: '^[a-z]+$' });
    expect(validateSchema(schema, '"hello"').valid).toBe(true);
    expect(validateSchema(schema, '"Hello123"').valid).toBe(false);
  });

  it('validates array items type', () => {
    const schema = JSON.stringify({ type: 'array', items: { type: 'number' } });
    expect(validateSchema(schema, '[1,2,3]').valid).toBe(true);
    expect(validateSchema(schema, '[1,"two",3]').valid).toBe(false);
  });

  it('returns error for invalid schema JSON', () => {
    const result = validateSchema('not json', '"test"');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error for invalid data JSON', () => {
    const result = validateSchema('{"type":"string"}', 'not json');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('validates properties types', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: {
        name: { type: 'string' },
        count: { type: 'number' }
      }
    });
    const invalid = JSON.stringify({ name: 123, count: 'abc' });
    const result = validateSchema(schema, invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });
});

describe('formatValidationResult', () => {
  it('formats valid result', () => {
    const result = formatValidationResult({ valid: true, errors: [] });
    expect(result).toContain('Valid');
  });

  it('formats invalid result with errors', () => {
    const result = formatValidationResult({ valid: false, errors: ['Error 1', 'Error 2'] });
    expect(result).toContain('Invalid');
    expect(result).toContain('1. Error 1');
    expect(result).toContain('2. Error 2');
  });
});
