import {
  formatGraphQL,
  extractGraphQLOperations,
  validateGraphQLBasic,
} from '../Components/Functions/GraphqlFormatterTools/logic';

// ─── formatGraphQL ────────────────────────────────────────────────────────────

describe('formatGraphQL', () => {
  it('formats a simple query', () => {
    const input = 'query { user { id name } }';
    const result = formatGraphQL(input);
    expect(result).toContain('query');
    expect(result).toContain('user');
    expect(result).toContain('id');
    expect(result).toContain('name');
  });

  it('indents nested fields', () => {
    const input = 'query { user { id name email } }';
    const result = formatGraphQL(input);
    const lines = result.split('\n');
    // user { line should be indented inside query block
    const userLine = lines.find(l => l.includes('user'));
    expect(userLine).toBeDefined();
    // user line should start with at least 2 spaces (indented under query block)
    expect(userLine!.startsWith('  ')).toBe(true);
  });

  it('formats a mutation', () => {
    const input = 'mutation createUser($name: String!) { createUser(name: $name) { id } }';
    const result = formatGraphQL(input);
    expect(result).toContain('mutation');
    expect(result).toContain('createUser');
  });

  it('formats a subscription', () => {
    const input = 'subscription { onMessage { id text } }';
    const result = formatGraphQL(input);
    expect(result).toContain('subscription');
    expect(result).toContain('onMessage');
  });

  it('throws on empty input', () => {
    expect(() => formatGraphQL('')).toThrow('Empty input');
    expect(() => formatGraphQL('   ')).toThrow('Empty input');
  });

  it('handles already-formatted input', () => {
    const input = 'query {\n  user {\n    id\n  }\n}';
    const result = formatGraphQL(input);
    expect(result).toContain('user');
    expect(result).toContain('id');
  });

  it('closing braces decrease indent', () => {
    const input = 'query { a { b { c } } }';
    const result = formatGraphQL(input);
    const lines = result.split('\n');
    const closingLines = lines.filter(l => l.trim() === '}');
    expect(closingLines.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── extractGraphQLOperations ─────────────────────────────────────────────────

describe('extractGraphQLOperations', () => {
  it('extracts a single query', () => {
    const ops = extractGraphQLOperations('query GetUser { user { id } }');
    expect(ops).toEqual(['query GetUser']);
  });

  it('extracts a mutation', () => {
    const ops = extractGraphQLOperations('mutation CreateUser($name: String!) { createUser(name: $name) { id } }');
    expect(ops).toEqual(['mutation CreateUser']);
  });

  it('extracts multiple operations', () => {
    const input = 'query GetUser { user { id } } mutation UpdateUser { updateUser { id } }';
    const ops = extractGraphQLOperations(input);
    expect(ops).toContain('query GetUser');
    expect(ops).toContain('mutation UpdateUser');
  });

  it('extracts fragment', () => {
    const ops = extractGraphQLOperations('fragment UserFields on User { id name }');
    expect(ops).toContain('fragment UserFields');
  });

  it('extracts subscription', () => {
    const ops = extractGraphQLOperations('subscription OnMessage { onMessage { id } }');
    expect(ops).toContain('subscription OnMessage');
  });

  it('returns empty array for no named operations', () => {
    const ops = extractGraphQLOperations('{ user { id } }');
    expect(ops).toEqual([]);
  });
});

// ─── validateGraphQLBasic ─────────────────────────────────────────────────────

describe('validateGraphQLBasic', () => {
  it('returns no errors for balanced braces', () => {
    const errors = validateGraphQLBasic('query { user { id } }');
    expect(errors).toHaveLength(0);
  });

  it('detects unbalanced opening braces', () => {
    const errors = validateGraphQLBasic('query { user { id }');
    expect(errors.some(e => e.includes('brace'))).toBe(true);
  });

  it('detects unbalanced closing braces', () => {
    const errors = validateGraphQLBasic('query { user { id } } }');
    expect(errors.some(e => e.includes('brace'))).toBe(true);
  });

  it('detects unbalanced parentheses', () => {
    const errors = validateGraphQLBasic('query { user(id: 1 { name } }');
    expect(errors.some(e => e.includes('paren'))).toBe(true);
  });

  it('returns no errors for balanced parens', () => {
    const errors = validateGraphQLBasic('query { user(id: 1) { name } }');
    expect(errors).toHaveLength(0);
  });

  it('reports multiple errors', () => {
    const errors = validateGraphQLBasic('query { user(id: 1 { name }');
    // unbalanced braces and parens
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });
});
