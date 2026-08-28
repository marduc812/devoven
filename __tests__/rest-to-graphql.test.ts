import { parseRestInput, generateGraphql, detectRestOrGraphql } from '../Components/Functions/RestToGraphqlTools/logic';

describe('parseRestInput', () => {
  it('parses GET /path', () => {
    const result = parseRestInput('GET /users');
    expect(result.method).toBe('GET');
    expect(result.path).toBe('/users');
  });

  it('parses POST /path with request body', () => {
    const input = 'POST /users\n\nREQUEST:\n{"name":"Alice"}\n\nRESPONSE:\n{"id":"1","name":"Alice"}';
    const result = parseRestInput(input);
    expect(result.method).toBe('POST');
    expect(result.path).toBe('/users');
    expect((result.request as Record<string, string>)?.name).toBe('Alice');
    expect((result.response as Record<string, string>)?.id).toBe('1');
  });

  it('parses DELETE with path params', () => {
    const result = parseRestInput('DELETE /users/{id}');
    expect(result.method).toBe('DELETE');
    expect(result.path).toBe('/users/{id}');
  });

  it('handles missing REQUEST/RESPONSE', () => {
    const result = parseRestInput('GET /posts');
    expect(result.request).toBeNull();
    expect(result.response).toBeNull();
  });
});

describe('generateGraphql', () => {
  it('returns empty string for empty input', () => {
    expect(generateGraphql('')).toBe('');
  });

  it('generates type definition from response', () => {
    const input = 'GET /users\nRESPONSE:\n{"id":"1","name":"Alice","active":true}';
    const result = generateGraphql(input);
    expect(result).toContain('type User {');
    expect(result).toContain('name: String');
    expect(result).toContain('active: Boolean');
  });

  it('generates Query type for GET', () => {
    const result = generateGraphql('GET /users\nRESPONSE:\n[{"id":"1"}]');
    expect(result).toContain('type Query {');
  });

  it('generates Mutation type for POST', () => {
    const result = generateGraphql('POST /users\nREQUEST:\n{"name":"Alice"}\nRESPONSE:\n{"id":"1","name":"Alice"}');
    expect(result).toContain('type Mutation {');
  });

  it('generates input type for mutations', () => {
    const input = 'POST /users\nREQUEST:\n{"name":"Alice","email":"alice@example.com"}\nRESPONSE:\n{"id":"1"}';
    const result = generateGraphql(input);
    expect(result).toContain('input UserInput {');
    expect(result).toContain('name: String');
    expect(result).toContain('email: String');
  });

  it('uses ID type for id fields', () => {
    const result = generateGraphql('GET /users\nRESPONSE:\n{"id":"1","name":"Alice"}');
    expect(result).toContain('id: ID');
  });

  it('generates array return type for array response', () => {
    const result = generateGraphql('GET /users\nRESPONSE:\n[{"id":"1"}]');
    expect(result).toContain('[User]');
  });

  it('includes resolver skeleton', () => {
    const result = generateGraphql('GET /users\nRESPONSE:\n{"id":"1"}');
    expect(result).toContain('const resolvers');
    expect(result).toContain('fetch(');
  });

  it('includes example query document', () => {
    const result = generateGraphql('GET /users\nRESPONSE:\n{"id":"1"}');
    expect(result).toContain('query ');
  });
});

describe('detectRestOrGraphql', () => {
  it('detects REST description', () => {
    expect(detectRestOrGraphql('GET /users')).toBe('rest');
  });

  it('detects GraphQL type', () => {
    expect(detectRestOrGraphql('type User { id: ID }')).toBe('graphql');
  });

  it('detects GraphQL query', () => {
    expect(detectRestOrGraphql('query GetUser { user { id } }')).toBe('graphql');
  });
});
