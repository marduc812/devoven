import { generateJsonSchema } from '@/Components/Functions/JsonSchemaGenTools/logic';

describe('generateJsonSchema', () => {
  it('returns empty on empty input', () => {
    expect(generateJsonSchema('')).toBe('');
  });

  it('throws on invalid JSON', () => {
    expect(() => generateJsonSchema('{invalid}')).toThrow('Invalid JSON');
  });

  it('infers string type', () => {
    const schema = JSON.parse(generateJsonSchema('"hello"'));
    expect(schema.type).toBe('string');
  });

  it('infers number type', () => {
    const schema = JSON.parse(generateJsonSchema('42'));
    expect(schema.type).toBe('integer');
  });

  it('infers float as number', () => {
    const schema = JSON.parse(generateJsonSchema('3.14'));
    expect(schema.type).toBe('number');
  });

  it('infers boolean type', () => {
    const schema = JSON.parse(generateJsonSchema('true'));
    expect(schema.type).toBe('boolean');
  });

  it('infers null type', () => {
    const schema = JSON.parse(generateJsonSchema('null'));
    expect(schema.type).toBe('null');
  });

  it('infers object with properties', () => {
    const schema = JSON.parse(generateJsonSchema('{"name": "Alice", "age": 30}'));
    expect(schema.type).toBe('object');
    expect(schema.properties.name.type).toBe('string');
    expect(schema.properties.age.type).toBe('integer');
  });

  it('includes required fields for non-null values', () => {
    const schema = JSON.parse(generateJsonSchema('{"name": "Alice", "optional": null}'));
    expect(schema.required).toContain('name');
    expect(schema.required).not.toContain('optional');
  });

  it('infers array with item type', () => {
    const schema = JSON.parse(generateJsonSchema('[1, 2, 3]'));
    expect(schema.type).toBe('array');
    expect(schema.items.type).toBe('integer');
  });

  it('detects email format', () => {
    const schema = JSON.parse(generateJsonSchema('"user@example.com"'));
    expect(schema.format).toBe('email');
  });

  it('detects date-time format', () => {
    const schema = JSON.parse(generateJsonSchema('"2024-01-01T00:00:00Z"'));
    expect(schema.format).toBe('date-time');
  });

  it('detects uri format', () => {
    const schema = JSON.parse(generateJsonSchema('"https://example.com"'));
    expect(schema.format).toBe('uri');
  });

  it('includes $schema property', () => {
    const schema = JSON.parse(generateJsonSchema('{}'));
    expect(schema.$schema).toContain('draft-07');
  });

  it('infers nested object', () => {
    const schema = JSON.parse(generateJsonSchema('{"address": {"city": "NYC"}}'));
    expect(schema.properties.address.type).toBe('object');
    expect(schema.properties.address.properties.city.type).toBe('string');
  });
});
