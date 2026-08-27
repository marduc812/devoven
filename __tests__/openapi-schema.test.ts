import {
  inferType,
  generateOpenApiSchema,
  generateSchemaOnly,
} from '@/Components/Functions/OpenApiSchemaTools/logic';

describe('inferType', () => {
  it('infers string', () => expect(inferType('hello')).toEqual({ type: 'string' }));
  it('infers boolean', () => expect(inferType(true)).toEqual({ type: 'boolean' }));
  it('infers integer', () => expect(inferType(42)).toEqual({ type: 'integer' }));
  it('infers number for float', () => expect(inferType(3.14)).toEqual({ type: 'number' }));
  it('infers null', () => expect(inferType(null)).toEqual({ type: 'null' }));
  it('infers array', () => {
    const result = inferType([1, 2, 3]);
    expect(result).toEqual({ type: 'array', items: { type: 'integer' } });
  });
  it('infers empty array with string items', () => {
    const result = inferType([]);
    expect(result).toEqual({ type: 'array', items: { type: 'string' } });
  });
  it('infers object', () => {
    const result = inferType({ name: 'Alice', age: 30 });
    expect(result).toMatchObject({ type: 'object' });
    if (result.type === 'object') {
      expect(result.properties.name).toEqual({ type: 'string' });
      expect(result.properties.age).toEqual({ type: 'integer' });
      expect(result.required).toContain('name');
      expect(result.required).toContain('age');
    }
  });
  it('does not require null fields', () => {
    const result = inferType({ name: 'Alice', alias: null });
    if (result.type === 'object') {
      expect(result.required).not.toContain('alias');
    }
  });
});

describe('generateOpenApiSchema', () => {
  it('returns error for invalid JSON', () => {
    expect(generateOpenApiSchema('not json')).toContain('Error');
  });
  it('generates valid OpenAPI structure', () => {
    const output = generateOpenApiSchema('{"id": 1, "name": "test"}');
    const parsed = JSON.parse(output);
    expect(parsed.openapi).toBe('3.0.0');
    expect(parsed.components.schemas.GeneratedSchema).toBeDefined();
  });
  it('includes type fields', () => {
    const output = generateOpenApiSchema('{"count": 5}');
    expect(output).toContain('integer');
  });
});

describe('generateSchemaOnly', () => {
  it('returns just the schema without openapi wrapper', () => {
    const output = generateSchemaOnly('{"active": true}');
    const parsed = JSON.parse(output);
    expect(parsed.type).toBe('object');
    expect(parsed.properties.active.type).toBe('boolean');
  });
  it('handles nested objects', () => {
    const output = generateSchemaOnly('{"user": {"id": 1}}');
    const parsed = JSON.parse(output);
    expect(parsed.properties.user.type).toBe('object');
  });
});
