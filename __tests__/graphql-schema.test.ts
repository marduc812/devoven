import { generateGraphqlSchema } from '@/Components/Functions/GraphqlSchemaTools/logic';

describe('generateGraphqlSchema', () => {
  it('returns error for invalid JSON', () => {
    expect(generateGraphqlSchema('not json')).toContain('Error');
  });
  it('returns error for arrays at root', () => {
    expect(generateGraphqlSchema('[1, 2, 3]')).toContain('Error');
  });
  it('generates type definition for simple object', () => {
    const result = generateGraphqlSchema('{"name": "Alice", "age": 30}');
    expect(result).toContain('type Root');
    expect(result).toContain('name: String!');
    expect(result).toContain('age: Int!');
  });
  it('infers Float for decimals', () => {
    const result = generateGraphqlSchema('{"price": 9.99}');
    expect(result).toContain('Float');
  });
  it('infers Boolean', () => {
    const result = generateGraphqlSchema('{"active": true}');
    expect(result).toContain('Boolean');
  });
  it('infers ID for uuid-like strings', () => {
    const result = generateGraphqlSchema('{"id": "550e8400-e29b-41d4-a716-446655440000"}');
    expect(result).toContain('ID');
  });
  it('handles nested objects as separate types', () => {
    const result = generateGraphqlSchema('{"user": {"name": "Bob"}}');
    expect(result).toContain('type User');
    expect(result).toContain('type Root');
  });
  it('handles arrays of objects', () => {
    const result = generateGraphqlSchema('{"items": [{"id": 1}]}');
    expect(result).toContain('[Item!]!');
  });
  it('includes example query comment', () => {
    const result = generateGraphqlSchema('{"name": "test"}');
    expect(result).toContain('Example Query');
  });
  it('marks null fields as nullable', () => {
    const result = generateGraphqlSchema('{"name": null}');
    // null fields should not have ! (non-null)
    expect(result).toMatch(/name: String(?!!)/);
  });
});
